import logging
from timeit import default_timer

import numpy as np
import umap
from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.handlers.auth import requires_auth_api
from smoosense.lance.table_client import LanceTableClient
from smoosense.utils.api import handle_api_errors

logger = logging.getLogger(__name__)
umap_bp = Blueprint("umap", __name__)


@umap_bp.post("/umap")
@requires_auth_api
@handle_api_errors
def compute_umap() -> Response:
    """Compute UMAP 2D projection for embedding column."""
    time_start = default_timer()

    if not request.json:
        raise ValueError("JSON body is required")

    table_path = request.json.get("tablePath")
    emb_column = request.json.get("embColumn")
    n_neighbors = request.json.get("nNeighbors", 15)
    min_dist = request.json.get("minDist", 0.1)
    query_engine = request.json.get("queryEngine", "duckdb")

    if not table_path:
        raise ValueError("tablePath is required")
    if not emb_column:
        raise ValueError("embColumn is required")

    # Validate parameters
    n_neighbors = max(2, min(100, int(n_neighbors)))
    min_dist = max(0.0, min(1.0, float(min_dist)))

    # Extract embeddings from table
    query = f"SELECT {emb_column} FROM '{table_path}'"

    embeddings: list[list[float]] = []

    if query_engine == "lance":
        lance_client = LanceTableClient.from_table_path(table_path)
        column_names, rows = lance_client.run_duckdb_sql(query)
        embeddings = [row[0] for row in rows if row[0] is not None]
    else:
        connection_maker = current_app.config["DUCKDB_CONNECTION_MAKER"]
        con = connection_maker()
        result = con.execute(query)
        rows = result.fetchall()
        embeddings = [row[0] for row in rows if row[0] is not None]

    if len(embeddings) < 2:
        raise ValueError("Not enough embeddings to compute UMAP (need at least 2)")

    # Convert to numpy array
    embeddings_array = np.array(embeddings, dtype=np.float32)

    # Adjust n_neighbors if larger than dataset
    actual_n_neighbors = min(n_neighbors, len(embeddings) - 1)

    # Compute UMAP
    reducer = umap.UMAP(
        n_neighbors=actual_n_neighbors,
        min_dist=min_dist,
        n_components=2,
        metric="cosine",
        random_state=42,
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
            "count": len(x_coords),
            "runtime": default_timer() - time_start,
            "params": {
                "nNeighbors": actual_n_neighbors,
                "minDist": min_dist,
            },
        }
    )
