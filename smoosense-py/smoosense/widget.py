"""Jupyter notebook widget for displaying DataFrames in SmooSense."""

import logging
import os
import tempfile
import threading
import time
from pathlib import Path
from typing import Optional, Union

try:
    import pandas as pd
    from IPython.display import IFrame
except ImportError as err:
    raise ImportError("pandas and IPython are required for the SmooSense widget") from err

try:
    import daft

    DAFT_AVAILABLE = True
except ImportError:
    DAFT_AVAILABLE = False

from smoosense.app import SmooSenseApp
from smoosense.utils.port import find_available_port


class _SmooSenseServer:
    """Singleton server manager for Jupyter widget."""

    _instance: Optional["_SmooSenseServer"] = None
    _lock = threading.Lock()
    _initialized: bool

    def __new__(cls) -> "_SmooSenseServer":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return

        self.app: Optional[SmooSenseApp] = None
        self.port: Optional[int] = None
        self.thread: Optional[threading.Thread] = None
        self.base_url: Optional[str] = None
        self._temp_files: set[str] = set()
        self._initialized = True

    def start_if_needed(self) -> None:
        """Start the server if it's not already running."""
        if self.app is not None:
            return  # Already running

        self.port = find_available_port(start_port=8001)  # Avoid default 8000
        self.base_url = f"http://localhost:{self.port}"

        # Create and configure the SmooSense app
        self.app = SmooSenseApp()
        flask_app = self.app.create_app()
        flask_app.config["TESTING"] = True

        # Suppress Flask HTTP access logs
        logging.getLogger("werkzeug").setLevel(logging.WARNING)

        # Start server in daemon thread
        self.thread = threading.Thread(
            target=lambda: flask_app.run(
                host="localhost", port=self.port, debug=False, use_reloader=False, threaded=True
            ),
            daemon=True,
        )
        self.thread.start()

        # Give server time to start
        time.sleep(1)
        print(f"SmooSense server started at {self.base_url}")

    def register_temp_file(self, filepath: str) -> None:
        """Register a temporary file for cleanup."""
        self._temp_files.add(filepath)

    def cleanup_temp_files(self) -> None:
        """Clean up temporary files."""
        for filepath in list(self._temp_files):
            try:
                if os.path.exists(filepath):
                    os.unlink(filepath)
                self._temp_files.remove(filepath)
            except Exception:
                pass  # Ignore cleanup errors


class Sense:
    """Jupyter widget for displaying DataFrames in SmooSense."""

    def __init__(self, dataframe: Union[pd.DataFrame, "daft.DataFrame"], height: int = 800):
        """
        Create a SmooSense widget for a pandas or daft DataFrame.

        Args:
            dataframe: The pandas or daft DataFrame to display
            height: Height of the IFrame in pixels
        """
        # Check if it's a pandas DataFrame
        if isinstance(dataframe, pd.DataFrame):
            self.df = dataframe
        # Check if it's a daft DataFrame and daft is available
        elif DAFT_AVAILABLE and hasattr(dataframe, "to_pandas"):
            # Convert daft DataFrame to pandas for processing
            self.df = dataframe.to_pandas()
        else:
            raise TypeError("Expected a pandas DataFrame or daft DataFrame")
        self.width = "100%"
        self.height = height
        self.server = _SmooSenseServer()

        # Start server if needed
        self.server.start_if_needed()

        # Create temporary parquet file
        self.temp_file = self._create_temp_parquet()

        # Register for cleanup
        self.server.register_temp_file(self.temp_file)

    def _create_temp_parquet(self) -> str:
        """Create a temporary parquet file from the DataFrame."""
        # Create temporary file with .parquet extension
        temp_fd, temp_path = tempfile.mkstemp(suffix=".parquet", prefix="smoosense_")
        os.close(temp_fd)  # Close file descriptor, we just need the path

        # Write DataFrame to parquet
        self.df.to_parquet(temp_path, index=False)

        return temp_path

    def _repr_html_(self) -> str:
        """Return HTML representation for Jupyter display."""
        # Construct URL for MiniTable
        table_path = Path(self.temp_file).as_posix()
        url = f"{self.server.base_url}/MiniTable?tablePath={table_path}"

        # Return IFrame HTML
        return f'''
        <iframe
            src="{url}"
            width="{self.width}"
            height="{self.height}"
            frameborder="0"
            style="border: 1px solid #ddd; border-radius: 4px;">
        </iframe>
        '''

    def show(self) -> "IFrame":
        """Explicitly show the widget (alternative to automatic display)."""
        table_path = Path(self.temp_file).as_posix()
        url = f"{self.server.base_url}/MiniTable?tablePath={table_path}"
        return IFrame(url, width="100%", height=self.height)

    def __del__(self) -> None:
        """Cleanup when widget is garbage collected."""
        try:
            if hasattr(self, "temp_file") and os.path.exists(self.temp_file):
                os.unlink(self.temp_file)
        except Exception:
            pass  # Ignore cleanup errors

    @staticmethod
    def folder(root_folder: str, height: int = 800) -> "IFrame":
        """
        Open the FolderBrowser interface for a given root folder.

        Args:
            root_folder: Path to the root folder to browse
            height: Height of the IFrame in pixels

        Returns:
            IFrame widget displaying the folder browser
        """
        server = _SmooSenseServer()
        server.start_if_needed()

        # Construct URL for FolderBrowser with rootFolder parameter
        url = f"{server.base_url}/FolderBrowser?rootFolder={root_folder}"

        return IFrame(url, width="100%", height=height)

    @staticmethod
    def table(table_path: str, height: int = 800) -> "IFrame":
        """
        Open the Table interface for a given file.

        Args:
            table_path: Path to the table file to display in table view
            height: Height of the IFrame in pixels

        Returns:
            IFrame widget displaying the table
        """
        server = _SmooSenseServer()
        server.start_if_needed()

        # Construct URL for Table with tablePath parameter
        tablepath = Path(table_path).as_posix()
        url = f"{server.base_url}/MiniTable?tablePath={tablepath}"

        return IFrame(url, width="100%", height=height)


def cleanup() -> None:
    """Manually cleanup all temporary files."""
    server = _SmooSenseServer()
    server.cleanup_temp_files()
    print("Cleaned up SmooSense temporary files")
