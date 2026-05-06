import logging
from timeit import default_timer
from typing import Any

from flask import Blueprint, Response, current_app, jsonify, request

from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors
from smoosense.utils.query_backends import check_permissions
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

    column_names: list[str] = []
    rows: list[tuple[Any, ...]] = []
    error = None

    try:
        # DB-API 2.0 cursor from the configured backend (DuckDB by default,
        # or any Arrow Flight SQL service when configured via env vars).
        connection_maker = current_app.config["QUERY_CONNECTION_MAKER"]
        cur = connection_maker()
        cur.execute(query)
        column_names = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()

    except Exception as e:
        error = str(e)
        logger.exception(f"Query execution failed: {error}")

    return jsonify(
        {
            "status": "success" if not error else "error",
            "column_names": column_names,
            "rows": serialize(rows),
            "runtime": default_timer() - time_start,
            "error": error,
        }
    )
