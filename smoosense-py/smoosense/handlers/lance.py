import logging

from flask import Blueprint, jsonify
from werkzeug.wrappers import Response

from smoosense.exceptions import InvalidInputException
from smoosense.lance.db_client import LanceDBClient
from smoosense.lance.table_client import LanceTableClient
from smoosense.utils.api import handle_api_errors, require_arg

logger = logging.getLogger(__name__)
lance_bp = Blueprint("lance", __name__)


@lance_bp.get("/lance/list-tables")
@handle_api_errors
def list_tables() -> Response:
    """List all tables in a Lance database directory."""
    root_folder = require_arg("rootFolder")

    try:
        client = LanceDBClient(root_folder)
        tables_info = client.list_tables()
        return jsonify([table.model_dump() for table in tables_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list tables from {root_folder}: {e}")
        raise InvalidInputException(f"Failed to list Lance tables: {e}") from e


@lance_bp.get("/lance/list-versions")
@handle_api_errors
def list_versions() -> Response:
    """List all versions of a table in a Lance database."""
    root_folder = require_arg("rootFolder")
    table_name = require_arg("tableName")

    try:
        client = LanceTableClient(root_folder, table_name)
        versions_info = client.list_versions()
        return jsonify([version.model_dump() for version in versions_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list versions for table {table_name}: {e}")
        raise InvalidInputException(f"Failed to list versions: {e}") from e
