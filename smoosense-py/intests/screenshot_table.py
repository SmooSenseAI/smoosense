"""Table page integration tests."""

import sys
import time
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from utils import LocatorUtils

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestTable(BaseIntegrationTest):
    """Test cases for Table page functionality."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and Table-specific configuration."""
        super().setUpClass()

        # Table path - use yolov7-object-detection.parquet
        project_root = Path(__file__).parent.parent.parent
        cls.table_path = str(project_root / "data" / "yolov7-object-detection.parquet")
        cls.table_url = f"{cls.server.base_url}/Table?tablePath={cls.table_path}"
        logger.info(f"Table URL configured: {cls.table_url}")

    def test_table_tab(self) -> None:
        """Test Table tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Table tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")
            time.sleep(2)  # Additional wait for data to load

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Table tab
            LocatorUtils.go_to_tab(self.page, "Table")
            time.sleep(1)  # Wait for grid to load

            # Test header stats for category_name and iou columns
            for column_name in ["category_name", "iou"]:
                logger.info(f"Testing Table tab with header stats for: {column_name}")

                # Click on header stats to show popover
                header_stats = LocatorUtils.select_header_stats(self.page, column_name)
                header_stats.click()
                time.sleep(0.5)  # Wait for popover to open

                # Take screenshot
                self.take_screenshot(f"table_table_{column_name}_{mode}.png")

                # Close popover by pressing Escape
                self.page.keyboard.press("Escape")
                time.sleep(0.3)

    def test_header_stats(self) -> None:
        """Test header stats for specific columns and take screenshots."""
        columns = ["iou", "confidence", "match_type", "category_name", "filename"]

        for mode in ["light", "dark"]:
            logger.info(f"Testing header stats with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Table tab
            LocatorUtils.go_to_tab(self.page, "Table")

            # Test each column's header stats component
            for column_name in columns:
                logger.info(f"Taking screenshot of header stats component for: {column_name}")

                # Get the header stats component locator
                header_stats = LocatorUtils.select_header_stats(self.page, column_name)

                # Take screenshot of just this component
                screenshot_path = (
                    self.screenshots_dir / f"table_header_stats_{column_name}_{mode}.png"
                )
                header_stats.screenshot(path=str(screenshot_path))
                logger.info(f"Screenshot saved: {screenshot_path}")

                time.sleep(0.2)
