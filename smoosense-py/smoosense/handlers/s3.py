import logging
from typing import Optional

from flask import Blueprint, Response, current_app, jsonify, redirect, request
from werkzeug.wrappers import Response as WerkzeugResponse

from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors
from smoosense.utils.s3_fs import S3FileSystem

logger = logging.getLogger(__name__)
s3_bp = Blueprint("s3", __name__)


@s3_bp.get("/s3-proxy")
@requires_auth_api
@handle_api_errors
def proxy() -> WerkzeugResponse:
    url: Optional[str] = request.args.get("url")
    if not url:
        raise ValueError("url parameter is required")

    # Get s3_client from app config
    s3_client = current_app.config["S3_CLIENT"]

    signed_url = S3FileSystem(s3_client).sign_get_url(url)
    response = redirect(signed_url)

    # Add CORS headers to allow cross-origin access from iframe
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    return response


@s3_bp.post("/s3-proxy")
@requires_auth_api
@handle_api_errors
def batch_proxy() -> Response:
    urls: list[str] = request.json.get("urls") if request.json else []

    # Get s3_client from app config
    s3_client = current_app.config["S3_CLIENT"]
    s3_fs = S3FileSystem(s3_client)
    signed = [s3_fs.sign_get_url(url) for url in urls]
    return jsonify(signed)
