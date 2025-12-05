import logging
import os
import pathlib
from collections.abc import Generator

import requests
from botocore.exceptions import ClientError
from flask import Blueprint, current_app, jsonify, request, send_file
from flask import Response as FlaskResponse
from werkzeug.wrappers import Response

from smoosense.exceptions import AccessDeniedException, InvalidInputException
from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors, require_arg
from smoosense.utils.local_fs import LocalFileSystem
from smoosense.utils.mime_types import get_mime_type
from smoosense.utils.s3_fs import S3FileSystem

logger = logging.getLogger(__name__)
fs_bp = Blueprint("fs", __name__)


def create_streaming_response(
    content_iterator: Generator[bytes, None, None], content_type: str
) -> FlaskResponse:
    """Create a Flask response with streaming content and CORS headers."""
    flask_response = FlaskResponse(content_iterator, content_type=content_type)
    flask_response.headers["Access-Control-Allow-Origin"] = "*"
    flask_response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    flask_response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    flask_response.headers["Content-Disposition"] = "inline"
    return flask_response


@fs_bp.get("/ls")
@requires_auth_api
@handle_api_errors
def get_ls() -> Response:
    path = require_arg("path")
    limit = int(request.args.get("limit", 100))
    show_hidden = request.args.get("show_hidden", "false").lower() == "true"
    if path.startswith("s3://"):
        s3_client = current_app.config["S3_CLIENT"]
        items = S3FileSystem(s3_client).list_one_level(path, limit)
    else:
        items = LocalFileSystem.list_one_level(path, limit, show_hidden)
    return jsonify([item.model_dump() for item in items])


@fs_bp.get("/get-file")
@requires_auth_api
@handle_api_errors
def get_file() -> Response:
    path = require_arg("path")
    redirect_param = request.args.get("redirect", "false").lower() == "true"
    ext = os.path.splitext(path)[1].lower()

    if path.startswith("http://"):
        logger.info(f"Proxying HTTP URL {path}")
        try:
            response = requests.get(path, stream=True, timeout=30)
            response.raise_for_status()

            content_type = response.headers.get("content-type", get_mime_type(ext))

            def generate() -> Generator[bytes, None, None]:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk

            return create_streaming_response(generate(), content_type)
        except requests.RequestException as e:
            logger.error(f"Failed to fetch HTTP URL {path}: {e}")
            raise InvalidInputException(f"Failed to fetch URL: {e}") from e

    elif path.startswith("s3://"):
        s3_client = current_app.config["S3_CLIENT"]
        s3_fs = S3FileSystem(s3_client)

        if redirect_param:
            logger.info(f"Redirecting to signed URL for {path}")
            from werkzeug.utils import redirect

            signed_url = s3_fs.sign_get_url(path)
            return redirect(signed_url)
        else:
            logger.info(f"Proxying S3 file {path}")
            try:
                from typing import Any
                from urllib.parse import urlparse

                parsed = urlparse(path)
                bucket = parsed.netloc
                key = parsed.path.lstrip("/")

                s3_response: Any = s3_client.get_object(Bucket=bucket, Key=key)

                def generate() -> Generator[bytes, None, None]:
                    chunk_size = 8192
                    while True:
                        chunk = s3_response["Body"].read(chunk_size)
                        if not chunk:
                            break
                        yield chunk

                content_type = get_mime_type(ext)
                return create_streaming_response(generate(), content_type)
            except Exception as e:
                logger.error(f"Failed to proxy S3 file {path}: {e}")
                raise InvalidInputException(f"Failed to read S3 file: {e}") from e

    else:
        if path.startswith("~"):
            path = os.path.expanduser(path)
        logger.info(f"Sending file {path}")
        file_response = send_file(path, mimetype=get_mime_type(ext))
        # Add CORS headers for local file responses
        file_response.headers["Access-Control-Allow-Origin"] = "*"
        file_response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        file_response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        file_response.headers["Content-Disposition"] = "inline"

        return file_response


@fs_bp.post("/upload")
@requires_auth_api
@handle_api_errors
def upload_file() -> Response:
    path = require_arg("path")
    try:
        content = request.json["content"] if request.json else None
        if content is None:
            raise KeyError("content")
    except (KeyError, ValueError, AssertionError) as e:
        raise InvalidInputException('Invalid content. Expecting JSON: {"content": "xxx"}') from e

    if path.startswith("s3://"):
        s3_client = current_app.config["S3_CLIENT"]
        try:
            S3FileSystem(s3_client).put_file(path, content)
            return jsonify({"status": "success"})
        except ClientError as e:
            msg = str(e)
            if "AccessDenied" in msg:
                raise AccessDeniedException(msg) from e
            else:
                raise e
    else:
        if path.startswith("~"):
            path = os.path.expanduser(path)
        pathlib.Path(os.path.dirname(path)).mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
    return jsonify({"status": "success"})
