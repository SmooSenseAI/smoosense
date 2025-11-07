"""
SmooSense CLI module.

Provides command-line interface for SmooSense application.
"""

from typing import Optional

import click

from smoosense.cli.server import run_app
from smoosense.cli.utils import get_package_version


@click.command()
@click.option("--version", "-v", is_flag=True, help="Show the version and exit.")
@click.option(
    "--port", "-p", type=int, help="Port number to run the server on (default: auto-select)"
)
@click.option(
    "--url-prefix", type=str, default="", help="URL prefix for the application (e.g., '/smoosense')"
)
def main(version: bool, port: Optional[int], url_prefix: str) -> None:
    """Smoothly make sense of your large-scale multi-modal tabular data.

    SmooSense provides a web interface for exploring and analyzing your data files.
    Supports CSV, Parquet, and other formats with SQL querying capabilities.

    \b
    Examples:
        sense                                  # Start SmooSense in current directory
        sense --port 8080                      # Use custom port
        sense --url-prefix /smoosense          # Add URL prefix
        sense --port 8080 --url-prefix /app    # Combine options
        sense --version                        # Show version information
    """

    if version:
        click.echo(f"sense, version {get_package_version()}")
        return
    run_app(port=port, url_prefix=url_prefix)


__all__ = ["main"]
