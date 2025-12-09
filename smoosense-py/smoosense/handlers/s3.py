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


@s3_bp.get("/s3-typeahead")
@requires_auth_api
@handle_api_errors
def s3_typeahead() -> Response:
    """
    Get typeahead suggestions for S3 paths.
    Returns prefixes (directories) that match the given path.
    """
    from urllib.parse import urlparse

    path: str = request.args.get("path", "") or ""

    # Must start with s3:// or be a partial prefix of s3:// (including empty string)
    if path and not path.startswith("s3://") and not "s3://".startswith(path):
        return jsonify([])

    s3_client = current_app.config["S3_CLIENT"]

    # If path is partial prefix of s3://, list all buckets
    if not path.startswith("s3://"):
        try:
            response = s3_client.list_buckets()
            bucket_suggestions = [f"s3://{b['Name']}/" for b in response.get("Buckets", [])]
            return jsonify(bucket_suggestions[:10])
        except Exception as e:
            logger.warning(f"Failed to list buckets: {e}")
            return jsonify([])

    # Parse the S3 URL
    parsed = urlparse(path)
    bucket: str = parsed.netloc
    key: str = str(parsed.path).lstrip("/")

    # If no bucket specified (e.g., s3://), list all buckets
    if not bucket:
        try:
            response = s3_client.list_buckets()
            bucket_suggestions = [f"s3://{b['Name']}/" for b in response.get("Buckets", [])]
            return jsonify(bucket_suggestions[:10])
        except Exception as e:
            logger.warning(f"Failed to list buckets: {e}")
            return jsonify([])

    # If no key specified and path doesn't end with /, match buckets by partial bucket name
    # If path ends with / (e.g., s3://bucket/), we should list bucket contents
    if not key and not path.endswith("/"):
        try:
            response = s3_client.list_buckets()
            bucket_lower = bucket.lower()
            bucket_suggestions = [
                f"s3://{b['Name']}/"
                for b in response.get("Buckets", [])
                if not bucket or b["Name"].lower().startswith(bucket_lower)
            ]
            return jsonify(bucket_suggestions[:10])
        except Exception as e:
            logger.warning(f"Failed to list buckets: {e}")
            return jsonify([])

    # Get the directory prefix and search prefix
    dir_prefix: str
    search_prefix: str
    if key.endswith("/") or not key:
        # Path ends with / or is just bucket, list contents
        dir_prefix = key
        search_prefix = ""
    else:
        # Path is partial, get parent dir and filename prefix
        parts = key.rsplit("/", 1)
        if len(parts) == 2:
            dir_prefix = parts[0] + "/"
            search_prefix = parts[1].lower()
        else:
            dir_prefix = ""
            search_prefix = parts[0].lower()

    suggestions: list[str] = []
    try:
        paginator = s3_client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket, Prefix=dir_prefix, Delimiter="/"):
            # Add common prefixes (directories)
            for prefix_entry in page.get("CommonPrefixes", []):
                prefix_path: str = prefix_entry["Prefix"]
                name = prefix_path[len(dir_prefix) :].rstrip("/")

                # Match search prefix (case-insensitive)
                if search_prefix and not name.lower().startswith(search_prefix):
                    continue

                suggestion = f"s3://{bucket}/{prefix_path}"
                suggestions.append(suggestion)

                if len(suggestions) >= 10:
                    break

            if len(suggestions) >= 10:
                break
    except Exception as e:
        logger.warning(f"Failed to list S3 prefixes: {e}")

    return jsonify(suggestions)
