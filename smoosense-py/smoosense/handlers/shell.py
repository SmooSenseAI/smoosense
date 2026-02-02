import logging
import os
import subprocess
from pathlib import Path

from flask import Blueprint, Response, jsonify, request

from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors

logger = logging.getLogger(__name__)
shell_bp = Blueprint("shell", __name__)


@shell_bp.post("/shell")
@requires_auth_api
@handle_api_errors
def run_shell_command() -> Response:
    if not request.json:
        raise ValueError("JSON body is required")

    command = request.json.get("command")
    if not command:
        raise ValueError("command is required in JSON body")

    table_path = request.json.get("tablePath")
    if not table_path:
        raise ValueError("tablePath is required in JSON body")

    # Use the directory containing the table file as working directory
    working_dir = str(Path(os.path.expanduser(table_path)).parent)
    if not os.path.isdir(working_dir):
        raise ValueError(f"Directory does not exist: {working_dir}")

    logger.info(f"Executing shell command: {command} in directory: {working_dir}")

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=working_dir,
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout
        )

        logger.info(
            f"Command result: returncode={result.returncode}, stdout={result.stdout}, stderr={result.stderr}"
        )

        return jsonify(
            {
                "success": result.returncode == 0,
                "message": "Command executed successfully"
                if result.returncode == 0
                else "Command failed",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
            }
        )
    except subprocess.TimeoutExpired:
        logger.error(f"Shell command timed out: {command}")
        return jsonify(
            {
                "success": False,
                "error": "Command timed out after 60 seconds",
            }
        )
    except Exception as e:
        logger.error(f"Shell command failed: {e}")
        return jsonify(
            {
                "success": False,
                "error": str(e),
            }
        )
