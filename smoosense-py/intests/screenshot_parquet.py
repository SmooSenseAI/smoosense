"""Parquet integration tests."""

import sys
import time
from pathlib import Path
from urllib.parse import quote

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from utils import LocatorUtils

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestParquet(BaseIntegrationTest):
    """Test cases for Parquet file functionality."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and Parquet-specific configuration."""
        super().setUpClass()

        # Define parquet files to test
        cls.parquet_files = {
            "nyc_taxi": "s3://smoosense-demo/datasets/NYCTaxi/yellow_tripdata_2009-01.parquet",
            "robot": "s3://smoosense-demo/datasets/PHUMA.parquet",
        }

        logger.info(f"Parquet test files configured: {list(cls.parquet_files.keys())}")

    def setUp(self) -> None:
        """Set up page with longer timeout for large parquet files."""
        super().setUp()
        # Increase timeout for loading large parquet files from S3
        self.page.set_default_timeout(120000)  # 120 seconds
        logger.info("Page timeout set to 120 seconds for parquet tests")

    def _get_table_url(self, table_path: str) -> str:
        """Construct table URL with properly encoded table path."""
        return f"{self.server.base_url}/Table?tablePath={quote(table_path)}"

    def test_parquet_info_dialog_screenshots(self) -> None:
        """Test Parquet info dialog and take screenshots for both files."""

        for file_key, table_path in self.parquet_files.items():
            logger.info(f"Taking screenshots for {file_key}")

            # Take screenshots for each theme mode
            for mode in ["light", "dark"]:
                logger.info(f"Testing {file_key} with {mode} mode")

                # Navigate to the Table page
                table_url = self._get_table_url(table_path)
                response = self.page.goto(table_url)
                self.assertEqual(response.status, 200)

                # Set theme mode
                logger.info(f"Setting theme to {mode} mode")
                LocatorUtils.set_theme_mode(self.page, mode)
                time.sleep(0.5)  # Wait for theme to apply

                # Find and click the info icon
                logger.info("Clicking File Information icon")
                info_button = self.page.locator('[title="File Information"]')
                info_button.wait_for(state="visible", timeout=5000)
                info_button.click()

                # Wait for dialog to appear
                time.sleep(1)

                # Screenshot the parquet info dialog
                logger.info(f"Taking screenshot of {file_key} info dialog")
                self.take_screenshot(f"parquet_{file_key}_info_{mode}.png")

                # Close the dialog by pressing Escape
                self.page.keyboard.press("Escape")
                time.sleep(0.5)

        logger.info("Parquet info dialog screenshot test completed successfully")
