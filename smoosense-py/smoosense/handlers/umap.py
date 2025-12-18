import logging
from timeit import default_timer

import numpy as np
from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.handlers.auth import requires_auth_api
from smoosense.lance.table_client import LanceTableClient
from smoosense.utils.api import handle_api_errors
from smoosense.utils.serialization import serialize

logger = logging.getLogger(__name__)
umap_bp = Blueprint("umap", __name__)

# Check if umap-learn is installed
try:
    import umap

    UMAP_AVAILABLE = True
except ImportError:
    UMAP_AVAILABLE = False
    umap = None

# Maximum number of rows to compute UMAP on (random sample if exceeded)
UMAP_MAX_ROWS = 1_000


@umap_bp.post("/umap")
@requires_auth_api
@handle_api_errors
def compute_umap() -> Response:
    """Compute UMAP 2D projection for embedding column."""
    if not UMAP_AVAILABLE:
        return jsonify(
            {
                "status": "error",
                "error": "UMAP is not installed. Install with: pip install 'smoosense[emb]'",
            }
        )

    time_start = default_timer()

    if not request.json:
        raise ValueError("JSON body is required")

    table_path = request.json.get("tablePath")
    emb_column = request.json.get("embColumn")
    extra_columns: list[str] = request.json.get("extraColumns", [])
    n_neighbors = request.json.get("nNeighbors", 15)
    min_dist = request.json.get("minDist", 0.1)
    query_engine = request.json.get("queryEngine", "duckdb")
    sql_condition = request.json.get("sqlCondition")

    if not table_path:
        raise ValueError("tablePath is required")
    if not emb_column:
        raise ValueError("embColumn is required")

    # Validate parameters
    n_neighbors = max(2, min(100, int(n_neighbors)))
    min_dist = max(0.0, min(1.0, float(min_dist)))

    # Build select columns: embedding + extra columns (deduplicated)
    # Filter out empty/whitespace-only column names
    select_cols = [emb_column]
    for col in extra_columns:
        col_stripped = col.strip() if col else ""
        if col_stripped and col_stripped not in select_cols:
            select_cols.append(col_stripped)

    # Quote column names to handle special characters and reserved words
    quoted_cols = [f'"{col}"' for col in select_cols]
    select_clause = ", ".join(quoted_cols)

    # Build WHERE clause if sql_condition is provided
    where_clause = f" WHERE {sql_condition}" if sql_condition else ""

    # Extract embeddings and additional columns from table
    embeddings: list[list[float]] = []
    # Use stripped column names for extra_values (excluding embedding column)
    extra_col_names = [col for col in select_cols if col != emb_column]
    extra_values: dict[str, list] = {col: [] for col in extra_col_names}

    try:
        if query_engine == "lance":
            query = f"SELECT {select_clause} FROM lance_table {where_clause}"
            lance_client = LanceTableClient.from_table_path(table_path)
            column_names, rows = lance_client.run_duckdb_sql(query)

            # Find column indices
            emb_idx = column_names.index(emb_column)
            extra_indices = {col: column_names.index(col) for col in extra_col_names}

            for row in rows:
                if row[emb_idx] is not None:
                    embeddings.append(row[emb_idx])
                    for col, idx in extra_indices.items():
                        extra_values[col].append(row[idx])
        else:
            query = f"SELECT {select_clause} FROM '{table_path}' {where_clause}"
            connection_maker = current_app.config["DUCKDB_CONNECTION_MAKER"]
            con = connection_maker()
            result = con.execute(query)
            column_names = [desc[0] for desc in result.description] if result.description else []
            rows = result.fetchall()

            # Find column indices
            emb_idx = column_names.index(emb_column)
            extra_indices = {col: column_names.index(col) for col in extra_col_names}

            for row in rows:
                if row[emb_idx] is not None:
                    embeddings.append(row[emb_idx])
                    for col, idx in extra_indices.items():
                        extra_values[col].append(row[idx])
    except Exception as e:
        error_msg = str(e)
        logger.error(f"SQL error in UMAP query: {error_msg}")
        return jsonify(
            {
                "status": "error",
                "error": f"Query error: {error_msg}",
            }
        )

    if len(embeddings) < 2:
        raise ValueError("Not enough embeddings to compute UMAP (need at least 2)")

    # Random sample if exceeds max rows
    sampled = False
    total_rows = len(embeddings)
    if total_rows > UMAP_MAX_ROWS:
        logger.info(f"Random sampling UMAP input from {total_rows} to {UMAP_MAX_ROWS} rows")
        rng = np.random.default_rng(seed=42)
        indices = rng.choice(total_rows, size=UMAP_MAX_ROWS, replace=False)
        indices.sort()  # Keep relative order for consistency
        embeddings = [embeddings[i] for i in indices]
        for col in extra_values:
            extra_values[col] = [extra_values[col][i] for i in indices]
        sampled = True

    # Convert to numpy array
    embeddings_array = np.array(embeddings, dtype=np.float32)

    # Adjust n_neighbors if larger than dataset
    actual_n_neighbors = min(n_neighbors, len(embeddings) - 1)

    # Compute UMAP with performance optimizations
    reducer = umap.UMAP(
        n_neighbors=actual_n_neighbors,
        min_dist=min_dist,
        n_components=2,
        metric="cosine",
        low_memory=False,  # Trade memory for speed
        n_jobs=-1,  # Use all CPU cores
    )
    projection = reducer.fit_transform(embeddings_array)

    # Convert to list for JSON serialization
    x_coords = projection[:, 0].tolist()
    y_coords = projection[:, 1].tolist()

    return jsonify(
        {
            "status": "success",
            "x": x_coords,
            "y": y_coords,
            "columnValues": {col: serialize(vals) for col, vals in extra_values.items()},
            "count": len(x_coords),
            "sampled": sampled,
            "totalRows": total_rows,
            "maxRows": UMAP_MAX_ROWS,
            "runtime": default_timer() - time_start,
            "params": {
                "nNeighbors": actual_n_neighbors,
                "minDist": min_dist,
            },
        }
    )
