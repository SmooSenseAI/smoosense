import logging
from timeit import default_timer

from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.utils.api import handle_api_errors
from smoosense.utils.duckdb_connections import check_permissions
from smoosense.utils.serialization import serialize

logger = logging.getLogger(__name__)
query_bp = Blueprint("query", __name__)


@query_bp.post("/query")
@handle_api_errors
def run_query() -> Response:
    connection_maker = current_app.config["DUCKDB_CONNECTION_MAKER"]
    con = connection_maker()
    time_start = default_timer()
    query = request.json["query"] if request.json else None
    if not query:
        raise ValueError("query is required in JSON body")

    check_permissions(query)

    column_names = []
    rows = []
    error = None
    try:
        result = con.execute(query)
        column_names = [desc[0] for desc in result.description]
        rows = result.fetchall()

    except Exception as e:
        error = str(e)

    return jsonify(
        {
            "status": "success" if not error else "error",
            "column_names": column_names,
            "rows": serialize(rows),
            "runtime": default_timer() - time_start,
            "error": error,
        }
    )
