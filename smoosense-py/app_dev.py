"""
Development server for SmooSense.

This file is excluded from the package build and is only used for local development.
"""

import logging
import os

import boto3
from rich.console import Console
from rich.logging import RichHandler

from smoosense.app import SmooSenseApp
from smoosense.my_logging import CommaFormatter


def configure_rich_logging() -> None:
    """Configure Rich logger with custom formatter and wider console"""
    # Create a console with custom width (default is 80, set to 200 or None for full terminal width)
    console = Console(width=200)  # Or use width=None for full terminal width

    handler = RichHandler(rich_tracebacks=True, console=console)
    handler.setFormatter(
        CommaFormatter("[%(relativeCreatedFormatted)sms] %(filename)s:%(lineno)d - %(message)s")
    )
    logging.basicConfig(level=logging.INFO, handlers=[handler])

    # Suppress verbose AWS SDK logs
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("s3transfer").setLevel(logging.WARNING)


if __name__ == "__main__":
    # Configure logging with rich
    configure_rich_logging()

    session = boto3.Session(profile_name="readonly")
    s3_client = session.client("s3")
    SmooSenseApp(
        s3_client=s3_client,
        folder_shortcuts={
            "Downloads": os.path.expanduser("~/Downloads"),
            "Work": "~/Work",
            "S3 bucket": "s3://sense-table-demo",
        },
    ).run(threaded=False, debug=True)
