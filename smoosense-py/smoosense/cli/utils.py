"""
Utility functions for SmooSense CLI.
"""

import time
import webbrowser
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as get_version
from typing import Callable

import click

ASCII_ART = """
 ▗▄▄▖▗▖  ▗▖ ▗▄▖  ▗▄▖  ▗▄▄▖▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▄▖
▐▌   ▐▛▚▞▜▌▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌   ▐▛▚▖▐▌▐▌   ▐▌
 ▝▀▚▖▐▌  ▐▌▐▌ ▐▌▐▌ ▐▌ ▝▀▚▖▐▛▀▀▘▐▌ ▝▜▌ ▝▀▚▖▐▛▀▀▘
▗▄▄▞▘▐▌  ▐▌▝▚▄▞▘▝▚▄▞▘▗▄▄▞▘▐▙▄▄▖▐▌  ▐▌▗▄▄▞▘▐▙▄▄▖
"""


def get_package_version() -> str:
    """Get the installed package version."""
    try:
        return get_version("smoosense")
    except PackageNotFoundError:
        return "dev"


def open_browser_after_delay(url: str, delay: int = 1) -> None:
    """Open the default browser after a delay to allow Flask to start."""
    time.sleep(delay)
    webbrowser.open(url)


def server_options(f: Callable) -> Callable:
    """
    Add common server options to a CLI command.

    Adds --port option to the decorated command.
    Note: Decorators are applied in reverse order, so these will appear
    after any other decorators applied before this one.
    """
    f = click.option(
        "--port",
        "-p",
        type=int,
        help="Port number to run the server on (default: auto-select)",
    )(f)
    return f
