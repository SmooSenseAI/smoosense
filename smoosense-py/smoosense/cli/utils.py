"""
Utility functions for SmooSense CLI.
"""

import time
import webbrowser
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as get_version

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
