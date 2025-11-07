"""
SmooSense CLI module.

Provides command-line interface for SmooSense application.
"""

import os
from typing import Optional

import click

from smoosense.cli.server import run_app
from smoosense.cli.utils import get_package_version, server_options


@click.group(invoke_without_command=True)
@click.option("--version", "-v", is_flag=True, help="Show the version and exit.")
@click.pass_context
def main(ctx: click.Context, version: bool) -> None:
    """Smoothly make sense of your large-scale multi-modal tabular data.

    SmooSense provides a web interface for exploring and analyzing your data files.
    Supports CSV, Parquet, and other formats with SQL querying capabilities.

    \b
    Examples:
        sense                                  # Browse current directory
        sense folder /path/to/folder           # Browse specific folder
        sense table /path/to/file.csv          # Open table viewer
        sense db /path/to/db                   # Open database browser
        sense --port 8080                      # Use custom port
        sense --version                        # Show version information
    """
    if version:
        click.echo(f"sense, version {get_package_version()}")
        ctx.exit()

    # If no subcommand is provided, default to 'folder .'
    if ctx.invoked_subcommand is None:
        ctx.invoke(folder, path=".")


@main.command()
@click.argument("path", type=click.Path(exists=True), default=".")
@server_options
def folder(path: str, port: Optional[int], url_prefix: str) -> None:
    """Open folder browser for the specified directory.

    \b
    Examples:
        sense folder .                         # Browse current directory
        sense folder /path/to/folder           # Browse specific folder
        sense folder ~/Downloads               # Browse Downloads folder
    """
    # Convert to absolute path
    abs_path = os.path.abspath(path)
    page_path = f"/FolderBrowser?rootFolder={abs_path}"
    run_app(page_path=page_path, port=port, url_prefix=url_prefix)


@main.command()
@click.argument("path", type=click.Path(exists=True))
@server_options
def table(path: str, port: Optional[int], url_prefix: str) -> None:
    """Open table viewer for the specified file.

    \b
    Examples:
        sense table data.csv                   # Open CSV file
        sense table /path/to/data.parquet      # Open Parquet file
        sense table ./results.csv --port 8080  # Use custom port
    """
    # Convert to absolute path
    abs_path = os.path.abspath(path)
    page_path = f"/Table?tablePath={abs_path}"
    run_app(page_path=page_path, port=port, url_prefix=url_prefix)


@main.command()
@click.argument("path", type=click.Path(exists=True), default=".")
@server_options
def db(path: str, port: Optional[int], url_prefix: str) -> None:
    """Open database browser for the specified directory.

    Scans the directory for Lance database folders (*.lance) and opens the DB viewer.

    \b
    Examples:
        sense db .                             # Browse current directory
        sense db /path/to/db                   # Browse specific database directory
        sense db ~/data/lance_dbs              # Browse Lance databases
    """
    # Convert to absolute path
    abs_path = os.path.abspath(path)

    # Check if this directory contains any .lance folders (only 1 layer deep)
    db_type = "lance"
    try:
        entries = os.listdir(abs_path)
        has_lance = any(
            entry.endswith(".lance") and os.path.isdir(os.path.join(abs_path, entry))
            for entry in entries
        )

        if has_lance:
            db_type = "lance"
        # Future: Could add detection for other DB types here
    except (OSError, PermissionError):
        # If we can't read the directory, just use default lance type
        pass

    page_path = f"/DB?dbPath={abs_path}&dbType={db_type}"
    run_app(page_path=page_path, port=port, url_prefix=url_prefix)


__all__ = ["main"]
