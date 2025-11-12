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

    def test_summarize_tab(self) -> None:
        """Test Summarize tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Summarize tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")
            time.sleep(2)  # Additional wait for data to load

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Summarize tab
            LocatorUtils.go_to_tab(self.page, "Summarize")
            time.sleep(1)
            self.take_screenshot(f"table_summarize_{mode}.png")

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

    def test_gallery_tab(self) -> None:
        """Test Gallery tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Gallery tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Gallery tab
            LocatorUtils.go_to_tab(self.page, "Gallery")
            time.sleep(1)  # Wait for gallery items to load

            # Click and hover on the 2nd matched item
            gallery_items = self.page.locator("div.gallery-item")
            second_item = gallery_items.nth(1)  # 0-indexed, so 1 is the 2nd item
            second_item.click()
            time.sleep(0.3)
            second_item.hover()
            time.sleep(0.5)

            self.take_screenshot(f"table_gallery_{mode}.png")

    def test_plot_bubbleplot_tab(self) -> None:
        """Test Plot > BubblePlot tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Plot > BubblePlot tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Plot tab
            LocatorUtils.go_to_tab(self.page, "Plot")
            time.sleep(0.5)

            # Click BubblePlot sub-tab
            LocatorUtils.go_to_tab(self.page, "BubblePlot")
            time.sleep(0.5)

            # Change x column to iou
            LocatorUtils.select_dropdown_option(self.page, "X Column", "iou")

            # Change y column to confidence
            LocatorUtils.select_dropdown_option(self.page, "Y Column", "confidence")
            time.sleep(0.5)

            self.take_screenshot(f"table_plot_bubbleplot_{mode}.png")

    def test_plot_histogram_tab(self) -> None:
        """Test Plot > Histogram tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Plot > Histogram tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Plot tab
            LocatorUtils.go_to_tab(self.page, "Plot")
            time.sleep(0.5)

            # Click Histogram sub-tab
            LocatorUtils.go_to_tab(self.page, "Histogram")
            time.sleep(0.5)

            # Change breakdown column to match_type
            LocatorUtils.select_dropdown_option(self.page, "Breakdown Column", "match_type")

            # Change histogram column to confidence
            LocatorUtils.select_dropdown_option(self.page, "Histogram Column", "confidence")
            time.sleep(0.5)

            self.take_screenshot(f"table_plot_histogram_{mode}.png")

    def test_plot_boxplot_tab(self) -> None:
        """Test Plot > BoxPlot tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Plot > BoxPlot tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Plot tab
            LocatorUtils.go_to_tab(self.page, "Plot")
            time.sleep(0.5)

            # Click BoxPlot sub-tab
            LocatorUtils.go_to_tab(self.page, "BoxPlot")
            LocatorUtils.select_dropdown_option(self.page, "Breakdown Column", "category_name")

            # Set Value Columns to iou and confidence
            LocatorUtils.select_multi_select_options(
                self.page, "Value Columns", ["iou", "confidence"]
            )

            # Click ag-grid header of confidence to sort
            confidence_header = self.page.locator('div.ag-header-cell[col-id="confidence"]')
            confidence_header.click()
            time.sleep(1)  # Wait for sort to apply and plot to update

            self.take_screenshot(f"table_plot_boxplot_{mode}.png")

    def test_query_tab(self) -> None:
        """Test Query tab and take screenshot."""
        for mode in ["light", "dark"]:
            logger.info(f"Testing Query tab with {mode} mode")

            # Navigate to the Table page
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")
            time.sleep(2)  # Additional wait for data to load

            # Set theme mode
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)

            # Click Query tab
            LocatorUtils.go_to_tab(self.page, "Query")
            time.sleep(0.5)

            # Click run query button
            logger.info("Clicking run query button")
            run_button = self.page.locator('button:has-text("Run Query")').first
            run_button.click()
            time.sleep(2)  # Wait for query to execute

            self.take_screenshot(f"table_query_{mode}.png")

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
