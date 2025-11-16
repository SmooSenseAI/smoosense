#!/usr/bin/env python
"""
Script to take screenshots of file/folder previews in FolderBrowser.

This captures previews for various file types including audio, images, videos, and data files.
"""

import sys
import time
import unittest
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from utils import LocatorUtils

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class PreviewScreenshotCapture(BaseIntegrationTest):
    """Capture screenshots of file/folder previews."""

    @classmethod
    def setUpClass(cls) -> None:
        """Set up server, browser and preview-specific configuration."""
        super().setUpClass()

        # Configure URL with S3 demo folder
        cls.root_folder = "s3://smoosense-demo/PreviewFiles"
        cls.folder_browser_url = f"{cls.server.base_url}/FolderBrowser?rootFolder={cls.root_folder}"
        logger.info(f"Preview URL configured: {cls.folder_browser_url}")

    def test_capture_screenshots(self) -> None:
        """Take screenshots of various file/folder previews."""

        # Files and folders to preview
        items_to_preview = [
            "audio-files",
            "image-files",
            "ClickBench-100M.parquet",
            "OpenVid-1M.csv",
            "captions_val2017.json",
            "readme.md",
        ]

        # Take screenshots for each theme mode
        for mode in ["light", "dark"]:
            logger.info(f"Setting theme to {mode} mode")

            # Click on each item and capture screenshot
            for item_name in items_to_preview:
                logger.info(f"Capturing preview for {item_name} in {mode} mode")

                try:
                    # Navigate to the FolderBrowser with fresh page load
                    response = self.page.goto(self.folder_browser_url)
                    if response.status != 200:
                        logger.error(f"Failed to load FolderBrowser: HTTP {response.status}")
                        continue

                    # Wait for the page to load completely
                    self.page.wait_for_load_state("networkidle")
                    time.sleep(2)  # Additional wait for tree to render

                    # Set theme mode
                    LocatorUtils.set_theme_mode(self.page, mode)
                    time.sleep(1)

                    # Find and click the item in tree view
                    item_locator = self.page.locator(f'span[title="{item_name}"]')

                    # Ensure item is visible and scrolled into view
                    item_locator.scroll_into_view_if_needed()
                    time.sleep(0.5)

                    item_locator.click()

                    # Wait for preview to load
                    self.page.wait_for_load_state("networkidle")
                    time.sleep(3)

                    # Take screenshot
                    # Sanitize filename (replace special characters)
                    safe_name = item_name.replace(".", "_").replace("/", "_")
                    screenshot_name = f"preview_{safe_name}_{mode}.png"
                    self.take_screenshot(screenshot_name)
                    logger.info(f"Screenshot saved: {screenshot_name}")

                except Exception as e:
                    logger.error(f"Failed to capture {item_name}: {e}")
                    continue

        logger.info("Screenshot capture completed successfully for previews")


if __name__ == "__main__":
    unittest.main()
