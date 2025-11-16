#!/usr/bin/env python
"""
Script to take screenshots of the FolderBrowser in both light and dark modes.

This is useful for documentation and visual regression testing.
"""

import sys
import time
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from utils import LocatorUtils

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class FolderBrowserScreenshotCapture(BaseIntegrationTest):
    """Capture screenshots of the FolderBrowser interface."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and FolderBrowser-specific configuration."""
        super().setUpClass()

        # Get the parent of parent directory of this file as rootFolder
        cls.root_folder = Path(__file__).parent.parent.parent
        cls.folder_browser_url = f"{cls.server.base_url}/FolderBrowser?rootFolder={cls.root_folder}"
        logger.info(f"FolderBrowser URL configured: {cls.folder_browser_url}")

    def capture_screenshots(self) -> None:
        """Take screenshots of the FolderBrowser in both light and dark modes."""

        # Navigate to the FolderBrowser
        response = self.page.goto(self.folder_browser_url)
        if response.status != 200:
            logger.error(f"Failed to load FolderBrowser: HTTP {response.status}")
            return

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

            # Click on some files/folders
            for file_type, file_name in {
                "csv": "dummy_data_various_types.csv",
                "parquet": "compare-video-generation.parquet",
                "image-folder": "images",
            }.items():
                self.page.locator(f'span[title="{file_name}"]').click()

                self.page.wait_for_load_state("networkidle")
                time.sleep(2)  # Additional wait for UI updates

                self.take_screenshot(f"folder_browser_{file_type}_{mode}.png")

            # Close images folder.
            self.page.locator('span[title="images"]').click()

        logger.info("Screenshot capture completed successfully for FolderBrowser")


def main():
    """Main entry point for running screenshot capture as a script."""
    import unittest

    # Create a test suite with just the screenshot capture
    suite = unittest.TestLoader().loadTestsFromName(
        "screenshot_folder_browser.FolderBrowserScreenshotCapture.capture_screenshots"
    )

    # Run the test
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
