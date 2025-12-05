import logging
import os
from typing import Optional

import boto3
import duckdb
from botocore.client import BaseClient
from flask import Flask
from pydantic import ConfigDict, validate_call

from smoosense.handlers.auth import auth_bp, init_oauth
from smoosense.handlers.fs import fs_bp
from smoosense.handlers.lance import lance_bp
from smoosense.handlers.pages import pages_bp
from smoosense.handlers.parquet import parquet_bp
from smoosense.handlers.query import query_bp
from smoosense.handlers.s3 import s3_bp
from smoosense.handlers.umap import umap_bp
from smoosense.utils.duckdb_connections import duckdb_connection_using_s3

PWD = os.path.dirname(os.path.abspath(__file__))


logger = logging.getLogger(__name__)


class SmooSenseApp:
    @validate_call(config=ConfigDict(arbitrary_types_allowed=True))
    def __init__(
        self,
        *,
        s3_client: Optional[BaseClient] = None,
        s3_prefix_to_save_shareable_link: str = "",
        folder_shortcuts: Optional[dict[str, str]] = None,
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
            self.duckdb_connection_maker = lambda: duckdb.connect()

        self.passover_config = {
            "S3_PREFIX_TO_SAVE_SHAREABLE_LINK": s3_prefix_to_save_shareable_link,
            "FOLDER_SHORTCUTS": folder_shortcuts or {},
        }

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
        app.register_blueprint(lance_bp, url_prefix="/api")
        app.register_blueprint(parquet_bp, url_prefix="/api")
        app.register_blueprint(pages_bp, url_prefix="")
        app.register_blueprint(s3_bp, url_prefix="/api")
        app.register_blueprint(umap_bp, url_prefix="/api")

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
