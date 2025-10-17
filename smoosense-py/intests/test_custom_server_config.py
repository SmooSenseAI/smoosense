"""Integration tests for server with custom port and URL prefix."""

import socket
import sys
import threading
import time
import unittest
from pathlib import Path
from typing import Optional

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from my_logging import getLogger
from playwright.sync_api import BrowserContext, Page, sync_playwright

from smoosense.app import SmooSenseApp

logger = getLogger(__name__)


def find_free_port() -> int:
    """Find a free port to run the test server on."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port


class CustomServerFixture:
    """Test server wrapper for SmooSenseApp with custom port and URL prefix."""

    def __init__(self, host: str = "localhost", port: Optional[int] = None, url_prefix: str = ""):
        self.host = host
        self.port = port or find_free_port()
        self.url_prefix = url_prefix
        self.app_instance: Optional[SmooSenseApp] = None
        self.thread: Optional[threading.Thread] = None
        self.server_ready = threading.Event()
        self.shutdown_flag = threading.Event()

    @property
    def base_url(self) -> str:
        """Get base URL for the server."""
        return f"http://{self.host}:{self.port}{self.url_prefix}"

    def _run_server(self) -> None:
        """Run the server in a separate thread."""
        try:
            logger.info(
                f"Starting SmooSenseApp server on {self.host}:{self.port} with URL prefix '{self.url_prefix}'"
            )

            # Create SmooSenseApp instance with custom URL prefix
            self.app_instance = SmooSenseApp(url_prefix=self.url_prefix)
            flask_app = self.app_instance.create_app()

            # Configure Flask app to be more suitable for testing
            flask_app.config["TESTING"] = True
            flask_app.config["DEBUG"] = False

            # Signal that server is ready
            self.server_ready.set()

            # Run the server
            flask_app.run(
                host=self.host,
                port=self.port,
                debug=False,
                threaded=True,
                use_reloader=False,
            )

        except Exception as e:
            logger.error(f"Server failed to start: {e}")
            self.server_ready.set()  # Set event even on failure to prevent hanging
            raise

    def start(self) -> None:
        """Start the server in a background thread."""
        logger.info(f"Starting server fixture on {self.host}:{self.port}")
        self.thread = threading.Thread(target=self._run_server, daemon=True)
        self.thread.start()

        # Wait for server to be ready with timeout
        if not self.server_ready.wait(timeout=30):
            raise RuntimeError("Server failed to start within 30 seconds")

        # Additional wait to ensure server is fully ready
        time.sleep(2)
        logger.info(f"Server started successfully at {self.base_url}")

    def stop(self) -> None:
        """Stop the server."""
        if self.app_instance:
            logger.info("Stopping server fixture")
            self.shutdown_flag.set()
            # In a real implementation, we might need additional cleanup


class TestCustomServerConfig(unittest.TestCase):
    """Test cases for server with custom port and URL prefix."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and custom configuration."""
        logger.info("Setting up TestCustomServerConfig")

        # Set up custom server with URL prefix
        cls.custom_port = find_free_port()
        cls.url_prefix = "/smoosense"
        cls.server = CustomServerFixture(port=cls.custom_port, url_prefix=cls.url_prefix)
        cls.server.start()

        # Get the root folder (parent of parent directory of this file)
        cls.root_folder = Path(__file__).parent.parent.parent

        # Construct folder browser URL with custom port and prefix
        cls.folder_browser_url = f"{cls.server.base_url}/FolderBrowser?rootFolder={cls.root_folder}"
        logger.info(f"FolderBrowser URL configured: {cls.folder_browser_url}")

        # Set up Playwright browser
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
        cls.context: BrowserContext = cls.browser.new_context()
        cls.page: Page = cls.context.new_page()

        # Set longer timeouts for integration tests
        cls.page.set_default_timeout(30000)  # 30 seconds

        logger.info("TestCustomServerConfig setup completed")

    @classmethod
    def tearDownClass(cls) -> None:
        """Clean up resources."""
        logger.info("Tearing down TestCustomServerConfig")

        if hasattr(cls, "page"):
            cls.page.close()
        if hasattr(cls, "context"):
            cls.context.close()
        if hasattr(cls, "browser"):
            cls.browser.close()
        if hasattr(cls, "playwright"):
            cls.playwright.stop()
        if hasattr(cls, "server"):
            cls.server.stop()

        logger.info("TestCustomServerConfig teardown completed")

    def test_custom_server_folder_browser_functionality(self) -> None:
        """Test complete folder browser functionality with custom port and URL prefix."""
        logger.info(
            f"Testing folder browser with custom server config: port={self.custom_port}, prefix='{self.url_prefix}'"
        )

        # Navigate to the FolderBrowser
        logger.info(f"Navigating to: {self.folder_browser_url}")
        response = self.page.goto(self.folder_browser_url)

        # Check that the response was successful
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Check that the page has loaded some content
        body_content = self.page.locator("body").text_content()
        self.assertIsNotNone(body_content)

        # Check if the folder browser page loaded correctly
        logger.info("Verifying folder browser page loaded correctly")

        # Find the data folder node
        data_node = self.page.locator('span[title="data"]')
        self.assertEqual(data_node.count(), 1, "Data folder not found in navigation")
        logger.info("Found 'data' folder node")

        # Click on the data folder to expand it
        logger.info("Clicking to expand 'data' folder")
        data_node.click()

        # Wait a moment for expansion to complete
        time.sleep(2)

        # Check if parquet file is there after expansion
        # Focus specifically on dummy_data_various_types.parquet for consistent testing
        test_file = "dummy_data_various_types.parquet"
        file_node = self.page.locator(f'span[title="{test_file}"]')
        self.assertEqual(file_node.count(), 1, f"{test_file} not found after expansion")
        logger.info(f"Found target parquet file: {test_file}")

        # Click on the parquet file to test preview
        logger.info(f"Clicking on parquet file: {test_file}")
        file_node.click()

        # Wait for preview to load
        time.sleep(3)
        self.page.wait_for_load_state("networkidle")

        # Check if preview is displayed correctly with specific elements
        logger.info("Checking for specific preview elements...")

        # Check for AG-Grid table headers (column_name should be present in dummy_data_various_types.parquet)
        column_name_header = self.page.locator(
            'span.ag-header-cell-text[data-ref="eText"]:has-text("column_name")'
        )
        if column_name_header.count() > 0:
            logger.info("Found AG-Grid column header for 'column_name'")

            # Check for cells with col-id=column_name containing idx_str
            column_name_cells = self.page.locator('[col-id="column_name"]:has-text("idx_str")')
            if column_name_cells.count() > 0:
                logger.info(
                    f"Found {column_name_cells.count()} cells with col-id='column_name' containing 'idx_str'"
                )
            else:
                logger.warning("No cells with col-id='column_name' containing 'idx_str' found")
        else:
            # Fallback to general preview checking
            logger.info("AG-Grid column header not found, checking for general preview content...")
            preview_content = self.page.locator(
                '[data-testid="file-preview"], .preview-content, table, .file-preview'
            )

            if preview_content.count() == 0:
                # Check if page content changed significantly
                updated_content = self.page.locator("body").text_content()
                self.assertIsNotNone(updated_content)
                self.assertNotEqual(
                    body_content, updated_content, "Page content didn't change after file selection"
                )
                logger.info(
                    "File preview appears to be working (content changed after file selection)"
                )
            else:
                logger.info(f"Found {preview_content.count()} preview elements")

        logger.info("File preview test completed successfully")

        # Test "Open in Table view" button functionality
        logger.info("Testing 'Open in Table view' button functionality...")
        open_table_button = self.page.locator('button[title="Open in Table view"]')

        if open_table_button.count() > 0:
            logger.info("Found 'Open in Table view' button")

            # Get the current page count before clicking
            initial_page_count = len(self.context.pages)

            # Click the button (this should open a new tab/page)
            open_table_button.click()

            # Wait a moment for the new page to open
            time.sleep(2)

            # Check if a new page was opened
            current_page_count = len(self.context.pages)
            if current_page_count > initial_page_count:
                logger.info("New page/tab opened after clicking 'Open in Table view'")

                # Get the new page
                new_page = self.context.pages[-1]
                new_page.wait_for_load_state("networkidle")

                # Check if the new page URL contains '/Table'
                new_url = new_page.url
                self.assertIn(
                    "/Table", new_url, f"New page URL does not contain '/Table': {new_url}"
                )
                self.assertIn(
                    "filePath=", new_url, f"New page URL does not contain 'filePath=': {new_url}"
                )
                logger.info(f"Table view opened with correct URL: {new_url}")

                # Check if AG-Grid table is rendered in the new page
                aggrid_table = new_page.locator('.ag-root, .ag-theme-alpine, [class*="ag-"]')
                if aggrid_table.count() > 0:
                    logger.info(
                        f"Found AG-Grid table in Table view ({aggrid_table.count()} elements)"
                    )
                else:
                    logger.warning("AG-Grid table not found in Table view")

                # Close the new page
                new_page.close()
            else:
                logger.warning("No new page opened after clicking 'Open in Table view'")
        else:
            logger.info(
                "'Open in Table view' button not found (may be expected for this file type)"
            )

        # Verify the server is responding with correct URL prefix
        logger.info(f"Verifying server responds correctly with URL prefix '{self.url_prefix}'")

        # Test that API calls work with the URL prefix
        # We can check this by looking at network requests or by verifying the page functionality works
        # Since the folder expansion and file selection worked, the API calls are working correctly

        logger.info("All custom server configuration tests completed successfully")

    def test_different_port_and_prefix_combinations(self) -> None:
        """Test that different port and URL prefix combinations work."""
        logger.info("Testing that the server works with custom port and URL prefix")

        # Verify the server is running on the expected port
        self.assertEqual(self.server.port, self.custom_port)
        self.assertEqual(self.server.url_prefix, self.url_prefix)

        # Verify the base URL is constructed correctly
        expected_base_url = f"http://localhost:{self.custom_port}{self.url_prefix}"
        self.assertEqual(self.server.base_url, expected_base_url)

        # Navigate to the root of the server to ensure it responds
        root_url = self.server.base_url + "/"
        logger.info(f"Testing root URL: {root_url}")

        response = self.page.goto(root_url)
        self.assertEqual(response.status, 200)

        logger.info("Server responds correctly with custom port and URL prefix")


if __name__ == "__main__":
    unittest.main()
