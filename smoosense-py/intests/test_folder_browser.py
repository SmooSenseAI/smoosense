"""FolderBrowser integration tests."""

import sys
import time
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from my_logging import getLogger
from utils import LocatorUtils

logger = getLogger(__name__)


class TestFolderBrowser(BaseIntegrationTest):
    """Test cases for the FolderBrowser functionality."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and FolderBrowser-specific configuration."""
        super().setUpClass()

        # Get the parent of parent directory of this file as rootFolder
        cls.root_folder = Path(__file__).parent.parent.parent
        cls.folder_browser_url = f"{cls.server.base_url}/FolderBrowser?rootFolder={cls.root_folder}"
        logger.info(f"FolderBrowser URL configured: {cls.folder_browser_url}")

    def test_folder_browser_loads_successfully(self) -> None:
        """Test that the FolderBrowser loads successfully with a rootFolder parameter."""

        # Navigate to the FolderBrowser
        response = self.page.goto(self.folder_browser_url)

        # Check that the response was successful
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Check that the page has loaded some content (not just a blank page)
        body_content = self.page.locator("body").text_content()
        self.assertIsNotNone(body_content)
        self.assertGreater(len(body_content.strip()), 0, "Page appears to be blank")
        logger.info(f"Page content length: {len(body_content.strip())} characters")

        # Check that the page title is accessible
        title = self.page.title()
        logger.info(f"Page title: '{title}'")

        # Assert that smoosense-gui and smoosense-py folders exist in the navigation
        smoosense_gui_node = self.page.locator('span[title="smoosense-gui"]')
        self.assertEqual(
            smoosense_gui_node.count(), 1, "smoosense-gui folder not found in navigation"
        )

        smoosense_py_node = self.page.locator('span[title="smoosense-py"]')
        self.assertEqual(
            smoosense_py_node.count(), 1, "smoosense-py folder not found in navigation"
        )

        logger.info("Found smoosense-gui and smoosense-py folders in navigation")
        logger.info("FolderBrowser load test completed successfully")

    def test_take_screenshots(self) -> None:
        """Take screenshots of the FolderBrowser in both light and dark modes."""

        # Navigate to the FolderBrowser
        logger.info(f"Navigating to FolderBrowser: {self.folder_browser_url}")
        response = self.page.goto(self.folder_browser_url)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Click on data folder to expand it
        logger.info("Expanding data folder")
        data_node = self.page.locator('span[title="data"]')
        data_node.click()
        time.sleep(1)  # Wait for expansion

        # Take screenshots for each theme mode
        for mode in ["light", "dark"]:
            logger.info(f"Setting theme to {mode} mode")
            LocatorUtils.set_theme_mode(self.page, mode)

            # Click on parquet file
            for file_type, file_name in {
                "parquet": "compare-video-generation.parquet",
                "csv": "dummy_data_various_types.csv",
            }.items():
                self.page.locator(f'span[title="{file_name}"]').click()

                self.page.wait_for_load_state("networkidle")
                time.sleep(2)  # Additional wait for UI updates

                self.take_screenshot(f"folder_browser_{file_type}_{mode}.png")

        logger.info("Screenshot test completed successfully for FolderBrowser")

    def test_data_folder_expansion(self) -> None:
        """Test that the data folder can be expanded and shows expected parquet files."""

        # Navigate to the FolderBrowser
        logger.info(f"Navigating to FolderBrowser: {self.folder_browser_url}")
        response = self.page.goto(self.folder_browser_url)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Wait for the data folder node to appear (up to 5 seconds)
        data_node = self.page.locator('span[title="data"]')
        data_node.wait_for(timeout=5000)  # Wait up to 5 seconds
        self.assertEqual(data_node.count(), 1, "Data folder not found in navigation")

        # Click on the data folder to expand it
        data_node.click()
        logger.info("Clicked on data folder")

        # Wait a moment for expansion to complete
        time.sleep(1)

        # Assert that the data folder is expanded and shows expected parquet files
        expected_files = ["compare-video-generation.parquet", "dummy_data_various_types.parquet"]
        for filename in expected_files:
            file_node = self.page.locator(f'span[title="{filename}"]')
            self.assertEqual(file_node.count(), 1, f"{filename} not found after expansion")

        logger.info("Found expected parquet files in expanded data folder")
        logger.info("Data folder expansion test completed successfully")
