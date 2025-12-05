import logging
from timeit import default_timer

from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.handlers.auth import requires_auth_api
from smoosense.lance.table_client import LanceTableClient
from smoosense.utils.api import handle_api_errors
from smoosense.utils.duckdb_connections import check_permissions
from smoosense.utils.serialization import serialize

logger = logging.getLogger(__name__)
query_bp = Blueprint("query", __name__)


@query_bp.post("/query")
@requires_auth_api
@handle_api_errors
def run_query() -> Response:
    time_start = default_timer()

    if not request.json:
        raise ValueError("JSON body is required")

    query = request.json.get("query")
    if not query:
        raise ValueError("query is required in JSON body")

    check_permissions(query)

    query_engine = request.json.get("queryEngine", "duckdb")

    column_names: list[str] = []
    rows: list[tuple] = []
    error = None

    try:
        if query_engine == "lance":
            # Lance query engine using DuckDB integration
            table_path = request.json.get("tablePath")
            if not table_path:
                raise ValueError("tablePath is required when using lance query engine")

            # Create Lance table client and execute query
            lance_client = LanceTableClient.from_table_path(table_path)
            column_names, rows = lance_client.run_duckdb_sql(query)

        else:
            # DuckDB query engine (default)
            connection_maker = current_app.config["DUCKDB_CONNECTION_MAKER"]
            con = connection_maker()
            result = con.execute(query)
            column_names = [desc[0] for desc in result.description] if result.description else []
            rows = result.fetchall()

    except Exception as e:
        error = str(e)
        logger.error(f"Query execution failed: {error}")

    return jsonify(
        {
            "status": "success" if not error else "error",
            "column_names": column_names,
            "rows": serialize(rows),
            "runtime": default_timer() - time_start,
            "error": error,
        }
    )
