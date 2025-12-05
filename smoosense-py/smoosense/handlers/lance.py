import logging

from flask import Blueprint, jsonify, request
from werkzeug.wrappers import Response

from smoosense.exceptions import InvalidInputException
from smoosense.handlers.auth import requires_auth_api
from smoosense.lance.db_client import LanceDBClient
from smoosense.lance.table_client import LanceTableClient
from smoosense.utils.api import handle_api_errors, require_arg

logger = logging.getLogger(__name__)
lance_bp = Blueprint("lance", __name__)


@lance_bp.get("/lance/list-tables")
@requires_auth_api
@handle_api_errors
def list_tables() -> Response:
    """List all tables in a Lance database directory."""
    db_path = require_arg("dbPath")
    db_type = request.args.get("dbType", "lance")

    if db_type != "lance":
        raise InvalidInputException(f"Unsupported database type: {db_type}")

    try:
        client = LanceDBClient(db_path)
        tables_info = client.list_tables()
        return jsonify([table.model_dump() for table in tables_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list tables from {db_path}: {e}")
        raise InvalidInputException(f"Failed to list Lance tables: {e}") from e


@lance_bp.get("/lance/list-versions")
@requires_auth_api
@handle_api_errors
def list_versions() -> Response:
    """List all versions of a table in a Lance database."""
    db_path = require_arg("dbPath")
    table_name = require_arg("tableName")
    db_type = request.args.get("dbType", "lance")

    if db_type != "lance":
        raise InvalidInputException(f"Unsupported database type: {db_type}")

    try:
        client = LanceTableClient(db_path, table_name)
        versions_info = client.list_versions()
        return jsonify([version.model_dump() for version in versions_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list versions for table {table_name}: {e}")
        raise InvalidInputException(f"Failed to list versions: {e}") from e


@lance_bp.get("/lance/list-indices")
@requires_auth_api
@handle_api_errors
def list_indices() -> Response:
    """List all indices of a table in a Lance database."""
    db_path = require_arg("dbPath")
    table_name = require_arg("tableName")
    db_type = request.args.get("dbType", "lance")

    if db_type != "lance":
        raise InvalidInputException(f"Unsupported database type: {db_type}")

    try:
        client = LanceTableClient(db_path, table_name)
        indices_info = client.list_indices()
        return jsonify([index.model_dump() for index in indices_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list indices for table {table_name}: {e}")
        raise InvalidInputException(f"Failed to list indices: {e}") from e


@lance_bp.get("/lance/list-columns")
@requires_auth_api
@handle_api_errors
def list_columns() -> Response:
    """List all columns of a table in a Lance database."""
    db_path = require_arg("dbPath")
    table_name = require_arg("tableName")
    db_type = request.args.get("dbType", "lance")

    if db_type != "lance":
        raise InvalidInputException(f"Unsupported database type: {db_type}")

    try:
        client = LanceTableClient(db_path, table_name)
        columns_info = client.list_columns()
        return jsonify([column.model_dump() for column in columns_info])
    except ValueError as e:
        raise InvalidInputException(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to list columns for table {table_name}: {e}")
        raise InvalidInputException(f"Failed to list columns: {e}") from e
