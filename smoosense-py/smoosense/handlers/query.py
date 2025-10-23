import logging
from timeit import default_timer

from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.utils.api import handle_api_errors
from smoosense.utils.athena_executor import execute_athena_query
from smoosense.utils.duckdb_connections import check_permissions
from smoosense.utils.serialization import serialize

logger = logging.getLogger(__name__)
query_bp = Blueprint("query", __name__)


@query_bp.post("/query")
@handle_api_errors
def run_query() -> Response:
    time_start = default_timer()

    if not request.json:
        raise ValueError("JSON body is required")

    query = request.json.get("query")
    if not query:
        raise ValueError("query is required in JSON body")

    # Get queryEngine parameter (default to 'duckdb')
    query_engine = request.json.get("queryEngine", "duckdb")

    # Validate queryEngine
    if query_engine not in ["duckdb", "athena", "lance"]:
        raise ValueError(f"Invalid queryEngine: {query_engine}. Must be 'duckdb', 'athena', or 'lance'")

    # Check permissions (applies to all engines)
    check_permissions(query)

    column_names = []
    rows = []
    error = None

    try:
        if query_engine == "athena":
            # Execute query using Athena
            database = request.json.get("database", 'default')
            workgroup = request.json.get("workgroup", 'primary')
            column_names, rows = execute_athena_query(query, database, workgroup)
        else:
            # Default: Execute query using DuckDB
            connection_maker = current_app.config["DUCKDB_CONNECTION_MAKER"]
            con = connection_maker()
            result = con.execute(query)
            column_names = [desc[0] for desc in result.description]
            rows = result.fetchall()

    except Exception as e:
        error = str(e)
        logger.error(f"Query execution failed ({query_engine}): {error}")

    return jsonify(
        {
            "status": "success" if not error else "error",
            "column_names": column_names,
            "rows": serialize(rows),
            "runtime": default_timer() - time_start,
            "error": error,
        }
    )
