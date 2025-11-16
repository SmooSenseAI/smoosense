"""Lance integration tests."""

import sys
import time
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from utils import LocatorUtils

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestLance(BaseIntegrationTest):
    """Test cases for Lance table functionality."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and Lance-specific configuration."""
        super().setUpClass()

        # Lance table path - go up one more level from smoosense-py to smoosense root
        project_root = Path(__file__).parent.parent.parent
        cls.lance_db_path = str(project_root / "data" / "lance")
        cls.lance_table_path = str(
            project_root / "data" / "lance" / "dummy_data_various_types.lance"
        )
        cls.table_url = f"{cls.server.base_url}/Table?tablePath={cls.lance_table_path}"
        cls.db_url = f"{cls.server.base_url}/DB?dbPath={cls.lance_db_path}"
        logger.info(f"Lance table URL configured: {cls.table_url}")
        logger.info(f"Lance DB URL configured: {cls.db_url}")

    def test_lance_table_loads_successfully(self) -> None:
        """Test that the Lance table loads successfully."""

        # Navigate to the Table page with Lance table
        response = self.page.goto(self.table_url)

        # Check that the response was successful
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Check that the page has loaded some content
        body_content = self.page.locator("body").text_content()
        self.assertIsNotNone(body_content)
        self.assertGreater(len(body_content.strip()), 0, "Page appears to be blank")
        logger.info(f"Page content length: {len(body_content.strip())} characters")

        # Check that the page title is accessible
        title = self.page.title()
        logger.info(f"Page title: '{title}'")

        logger.info("Lance table load test completed successfully")

    def test_lance_info_dialog_screenshots(self) -> None:
        """Test Lance info dialog and take screenshots of Indices and Versions tabs."""

        # Take screenshots for each theme mode
        for mode in ["light", "dark"]:
            logger.info(f"Testing with {mode} mode")

            # Navigate to the Table page with Lance table
            response = self.page.goto(self.table_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")
            time.sleep(2)  # Additional wait for data to load

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

            # Screenshot the Indices tab (default tab)
            logger.info("Taking screenshot of Indices tab")
            self.take_screenshot(f"lance_indices_tab_{mode}.png")

            # Click the Versions tab
            logger.info("Clicking Versions tab")
            versions_tab = self.page.locator('button[role="tab"]:has-text("Versions")')
            versions_tab.wait_for(state="visible", timeout=5000)
            versions_tab.click()

            # Wait for versions content to load
            time.sleep(1)

            # Screenshot the Versions tab
            logger.info("Taking screenshot of Versions tab")
            self.take_screenshot(f"lance_versions_tab_{mode}.png")

            # Close the dialog by pressing Escape
            self.page.keyboard.press("Escape")
            time.sleep(0.5)

        logger.info("Lance info dialog screenshot test completed successfully")

    def test_lancedb_screenshots(self) -> None:
        """Test Lance DB page and take screenshots after selecting a table."""

        # Take screenshots for each theme mode
        for mode in ["light", "dark"]:
            logger.info(f"Testing LanceDB with {mode} mode")

            # Navigate to the DB page
            response = self.page.goto(self.db_url)
            self.assertEqual(response.status, 200)

            # Wait for the page to load completely
            self.page.wait_for_load_state("networkidle")

            # Set theme mode
            logger.info(f"Setting theme to {mode} mode")
            LocatorUtils.set_theme_mode(self.page, mode)
            time.sleep(0.5)  # Wait for theme to apply

            # Find and click the dummy_data_various_types table in the left panel
            logger.info("Clicking on dummy_data_various_types table")
            table_item = self.page.locator('span.font-medium:has-text("dummy_data_various_types")')
            table_item.wait_for(state="visible", timeout=5000)
            table_item.click()

            # Wait for table preview to load
            time.sleep(1)

            # Take screenshot
            logger.info("Taking screenshot of LanceDB with selected table")
            self.take_screenshot(f"lancedb_{mode}.png")

        logger.info("LanceDB screenshot test completed successfully")
