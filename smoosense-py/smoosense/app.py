import logging
import os

import boto3
from botocore.client import BaseClient
from flask import Flask, Response, jsonify, request
from pydantic import ConfigDict, validate_call

from smoosense.handlers.auth import auth_bp, init_oauth
from smoosense.handlers.fs import fs_bp
from smoosense.handlers.lance import lance_bp
from smoosense.handlers.numpy_preview import numpy_bp
from smoosense.handlers.pages import pages_bp
from smoosense.handlers.parquet import parquet_bp
from smoosense.handlers.query import query_bp
from smoosense.handlers.s3 import s3_bp
from smoosense.handlers.shell import shell_bp
from smoosense.handlers.umap import umap_bp
from smoosense.utils.duckdb_connections import duckdb_connection_default, duckdb_connection_using_s3

PWD = os.path.dirname(os.path.abspath(__file__))


logger = logging.getLogger(__name__)


class SmooSenseApp:
    @validate_call(config=ConfigDict(arbitrary_types_allowed=True))
    def __init__(
        self,
        *,
        s3_client: BaseClient | None = None,
        s3_prefix_to_save_shareable_link: str = "",
        folder_shortcuts: dict[str, str] | None = None,
    ):
        self.s3_client = s3_client if s3_client is not None else boto3.client("s3")

        # Check if S3/AWS configuration is available
        # This includes explicit s3_client, environment variables, or AWS config files
        has_s3_config = any(
            [
                s3_client is not None,
                os.getenv("S3_PROFILE") is not None,
                os.getenv("AWS_ENDPOINT_URL") is not None,
                os.getenv("AWS_ACCESS_KEY_ID") is not None,
                os.getenv("AWS_SECRET_ACCESS_KEY") is not None,
                os.path.exists(os.path.expanduser("~/.aws/credentials")),
            ]
        )

        if has_s3_config:
            self.duckdb_connection_maker = duckdb_connection_using_s3(s3_client=self.s3_client)
        else:
            self.duckdb_connection_maker = duckdb_connection_default()

        self.local_folder_pattern: str | None = os.environ.get("SMOOSENSE_LOCAL_FOLDER_PATTERN")

        self.passover_config = {
            "S3_PREFIX_TO_SAVE_SHAREABLE_LINK": s3_prefix_to_save_shareable_link,
            "FOLDER_SHORTCUTS": folder_shortcuts or {},
            "LOCAL_FOLDER_PATTERN": self.local_folder_pattern,
        }

    def _check_local_path_access(self) -> tuple[Response, int] | None:
        """Flask before_request hook: block local path access based on config."""
        path_params = [
            request.args.get("path", ""),
            request.args.get("prefix", ""),
            request.form.get("path", ""),
        ]

        for path in path_params:
            if not path:
                continue
            # Only check local paths (absolute or tilde-relative)
            if not (path.startswith("/") or path.startswith("~")):
                continue
            # Local path detected — enforce pattern
            if self.local_folder_pattern is None:
                return jsonify({"error": "Local folder access is not allowed"}), 403
            if not path.startswith(self.local_folder_pattern):
                return jsonify({"error": "Path not allowed by server configuration"}), 403
        return None

    def create_app(self) -> Flask:
        app = Flask(__name__, static_folder="statics", static_url_path="")

        # Store the s3_client in app config so blueprints can access it
        app.config["S3_CLIENT"] = self.s3_client
        app.config["DUCKDB_CONNECTION_MAKER"] = self.duckdb_connection_maker
        app.config["PASSOVER_CONFIG"] = self.passover_config

        # Initialize Auth0 if configured
        oauth = init_oauth(app)
        if oauth is not None:
            app.config["OAUTH"] = oauth
            logger.info("Auth0 authentication enabled")
        else:
            logger.info("Auth0 not configured, running without authentication")

        # Register blueprints
        app.register_blueprint(auth_bp, url_prefix="/auth")
        app.register_blueprint(query_bp, url_prefix="/api")
        app.register_blueprint(fs_bp, url_prefix="/api")
        app.register_blueprint(numpy_bp, url_prefix="/api")
        app.register_blueprint(lance_bp, url_prefix="/api")
        app.register_blueprint(parquet_bp, url_prefix="/api")
        app.register_blueprint(pages_bp, url_prefix="")
        app.register_blueprint(s3_bp, url_prefix="/api")
        app.register_blueprint(shell_bp, url_prefix="/api")
        app.register_blueprint(umap_bp, url_prefix="/api")

        app.before_request(self._check_local_path_access)

        return app

    def run(
        self,
        *,
        host: str = "0.0.0.0",
        port: int = 8000,
        threaded: bool = False,
        debug: bool = False,
    ) -> None:
        app = self.create_app()
        # Enable threaded mode for concurrent requests in development
        app.run(host=host, port=port, threaded=threaded, debug=debug)
