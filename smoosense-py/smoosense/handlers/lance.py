import logging
import os

import lancedb
from flask import Blueprint, jsonify, request
from werkzeug.wrappers import Response

from smoosense.exceptions import InvalidInputException
from smoosense.utils.api import handle_api_errors, require_arg

logger = logging.getLogger(__name__)
lance_bp = Blueprint("lance", __name__)


@lance_bp.get("/lance/list-tables")
@handle_api_errors
def list_tables() -> Response:
    """List all tables in a Lance database directory."""
    root_folder = require_arg("rootFolder")

    if root_folder.startswith("~"):
        root_folder = os.path.expanduser(root_folder)

    if not os.path.exists(root_folder):
        raise InvalidInputException(f"Directory does not exist: {root_folder}")

    if not os.path.isdir(root_folder):
        raise InvalidInputException(f"Path is not a directory: {root_folder}")

    try:
        logger.info(f"Connecting to Lance database at {root_folder}")
        db = lancedb.connect(root_folder)
        table_names = db.table_names()
        logger.info(f"Found {len(table_names)} tables: {table_names}")

        # Get basic info for each table
        tables_info = []
        for table_name in table_names:
            try:
                table = db.open_table(table_name)
                tables_info.append({
                    "name": table_name,
                    "cnt_rows": table.count_rows(),
                    "cnt_columns": len(table.schema)
                })
            except Exception as e:
                logger.warning(f"Failed to get info for table {table_name}: {e}")
                tables_info.append({
                    "name": table_name,
                    "cnt_rows": None,
                    "cnt_columns": None
                })

        return jsonify(tables_info)
    except Exception as e:
        logger.error(f"Failed to list tables from {root_folder}: {e}")
        raise InvalidInputException(f"Failed to list Lance tables: {e}") from e
