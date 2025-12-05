import json
import logging
import os
import textwrap

from flask import Blueprint, Response, current_app, jsonify, request, send_file

from smoosense.handlers.auth import requires_auth
from smoosense.utils.s3_fs import S3FileSystem

PWD = os.path.dirname(os.path.abspath(__file__))

logger = logging.getLogger(__name__)
pages_bp = Blueprint("pages", __name__)


def serve_static_html(filepath: str) -> Response:
    """Helper function to serve static HTML files"""
    state_file = request.args.get("state")
    template_file_path = os.path.join(PWD, f"../statics/{filepath}.html")
    with open(template_file_path) as f:
        content = f.read()
    state_data = {}
    if state_file:
        # Get the S3 client from Flask app config
        s3_client = current_app.config["S3_CLIENT"]
        s3_fs = S3FileSystem(s3_client)
        try:
            state_content = s3_fs.read_text_file(state_file)
            if state_content:
                state_data = json.loads(state_content)
        except Exception as e:
            logger.exception(f"Failed to read state file from S3: {e}")

    passover_config = current_app.config.get("PASSOVER_CONFIG")
    passover_content = ""
    if passover_config:
        passover_content = "\n".join(
            f"window.{k} = {json.dumps(v)};" for k, v in passover_config.items()
        )
    content = content.replace(
        "<head>",
        textwrap.dedent(f"""
        <head>
        <script>
            window.PRE_LOADED_STATE = {json.dumps(state_data)};
            {passover_content}
        </script>
        </head>"""),
    )
    return Response(content, mimetype="text/html")


@pages_bp.get("/")
@requires_auth
def home() -> Response:
    return serve_static_html("index")


@pages_bp.get("/FolderBrowser")
@requires_auth
def get_folder_browser() -> Response:
    return serve_static_html("FolderBrowser")


@pages_bp.get("/Table")
@requires_auth
def get_tabular_slice_dice() -> Response:
    return serve_static_html("Table")


@pages_bp.get("/DB")
@requires_auth
def get_db() -> Response:
    return serve_static_html("DB")


@pages_bp.get("/MiniTable")
@requires_auth
def get_mini_table() -> Response:
    return serve_static_html("MiniTable")


@pages_bp.get("/example/<path:subpath>")
def get_example(subpath: str) -> Response:
    """Handle all /example/* routes by serving the index page"""
    if subpath.endswith(".txt"):
        return send_file(os.path.join(PWD, f"../statics/example/{subpath}"))
    else:
        return serve_static_html("example/" + subpath)


@pages_bp.get("/api/health")
def healthchecker() -> Response:
    return jsonify({"status": "success", "message": "SmooSense is running"})
