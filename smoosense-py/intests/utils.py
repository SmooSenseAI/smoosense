"""Utility functions and classes for integration tests."""

import time

from playwright.sync_api import Page

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class LocatorUtils:
    """Utility class for common page interactions in integration tests."""

    @staticmethod
    def set_theme_mode(page: Page, mode: str) -> None:
        """
        Set the theme mode by opening settings popover and clicking the specified theme button.

        Args:
            page: Playwright page instance
            mode: Theme mode to set ('light', 'system', or 'dark')
        """
        logger.info(f"Setting theme mode to: {mode}")

        # Wait for page to be ready and find the settings button
        page.wait_for_load_state("networkidle")
        settings_button = page.locator('[data-slot="popover-trigger"][title="Settings"]')
        settings_button.click()

        # Wait for the popover to appear
        popover = page.locator('[data-slot="popover-content"]')
        popover.wait_for(state="visible", timeout=5000)

        # Find and click the specified theme button
        theme_button = popover.locator(f'button[title="{mode.title()}"]')
        if theme_button.count() == 0:
            raise ValueError(f"Theme button for mode '{mode}' not found")

        theme_button.click()

        # Close the popover by clicking elsewhere
        page.click("body")
        # Wait a moment for theme to apply
        time.sleep(0.5)
        logger.info(f"Theme mode set to: {mode}")
