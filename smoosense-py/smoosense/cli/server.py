"""
Server management for SmooSense CLI.
"""

import atexit
import os
import threading
import webbrowser
from typing import Optional

from smoosense.app import SmooSenseApp
from smoosense.cli.state import (
    create_server_state,
    get_running_server,
    get_server_url,
    remove_server_state,
)
from smoosense.cli.utils import ASCII_ART, open_browser_after_delay
from smoosense.my_logging import getLogger
from smoosense.utils.port import find_available_port

logger = getLogger(__name__)


def run_app(page_path: str, port: Optional[int] = None, url_prefix: str = "") -> None:
    """
    Run the SmooSense application server.

    If a server is already running, opens the browser to the existing server.
    Otherwise, starts a new server instance.

    Args:
        page_path: Page path with query params (e.g., '/FolderBrowser?rootFolder=/path')
        port: Port number to run the server on (auto-selected if None)
        url_prefix: URL prefix for the application (e.g., '/smoosense')
    """
    # Check if server is already running
    running_server = get_running_server()

    if running_server:
        # Server already running, just open browser
        logger.info(
            f"Server already running on port {running_server.port} (PID: {running_server.pid})"
        )
        url = get_server_url(running_server, page_path)

        print("\033[33m⚡ Server already running!\033[0m")  # Yellow text
        print(f"\033[32m👉 Opening browser: \033[1;34m{url}\033[0m\n")

        webbrowser.open(url)
        return

    # No running server, start a new one
    # Use provided port or find available one
    if port is None:
        port = find_available_port()

    # Validate and normalize url_prefix
    if url_prefix:
        # Ensure it starts with / and doesn't end with /
        if not url_prefix.startswith("/"):
            url_prefix = "/" + url_prefix
        url_prefix = url_prefix.rstrip("/")

    # Construct URL with optional prefix
    base_path = url_prefix if url_prefix else ""
    url = f"http://localhost:{port}{base_path}{page_path}"

    # Using ANSI escape codes for colors
    print("\033[36m" + ASCII_ART + "\033[0m")  # Cyan color for ASCII art
    print(f"\033[32m👉 Opening browser: \033[1;34m{url}\033[0m\n\n")  # Green text, blue URL

    # Register cleanup handler to remove state file on exit
    atexit.register(remove_server_state)

    # Create server state file
    create_server_state(port=port, url_prefix=url_prefix)
    logger.info(f"Created server state file for port {port}, PID {os.getpid()}")

    # Start browser opening in a separate thread
    browser_thread = threading.Thread(target=open_browser_after_delay, args=(url,), daemon=True)
    browser_thread.start()

    # Create app with url_prefix if provided
    app = SmooSenseApp(url_prefix=url_prefix)
    app.run(host="localhost", port=port)
