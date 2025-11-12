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

    @staticmethod
    def go_to_tab(page: Page, tab_name: str) -> None:
        """
        Navigate to a tab by clicking on it.

        Args:
            page: Playwright page instance
            tab_name: Name of the tab to click (e.g., 'Summarize', 'Table', 'Plot', 'BubblePlot')
        """
        logger.info(f"Navigating to tab: {tab_name}")
        tab = page.locator(f'button[role="tab"]:has-text("{tab_name}")')
        tab.click()

    @staticmethod
    def select_dropdown_option(page: Page, label: str, value: str) -> None:
        """
        Select an option from a dropdown/combobox by label and value.

        Args:
            page: Playwright page instance
            label: Label text of the dropdown (e.g., 'X Column', 'Breakdown Column')
            value: Value to select from the dropdown (e.g., 'iou', 'confidence')
        """
        logger.info(f"Selecting '{value}' from '{label}' dropdown")

        # Find the label and navigate to the combobox trigger
        label_locator = page.locator(f'label:has-text("{label}")')
        trigger = label_locator.locator("..").locator('button[role="combobox"]').first
        trigger.click()
        time.sleep(0.3)

        # Select the option
        page.locator(f'[role="option"]:has-text("{value}")').first.click()
        time.sleep(0.5)

    @staticmethod
    def select_multi_select_options(page: Page, label: str, values: list[str]) -> None:
        """
        Select multiple options from a multi-select dropdown by label and values.

        Args:
            page: Playwright page instance
            label: Label text of the multi-select dropdown (e.g., 'Value Columns')
            values: List of values to select (e.g., ['iou', 'confidence'])
        """
        logger.info(f"Selecting {values} from '{label}' multi-select")

        # Find the label and navigate to the button trigger
        label_locator = page.locator(f'label:has-text("{label}")')
        trigger = label_locator.locator("..").locator("button").first
        trigger.click()
        time.sleep(0.3)

        # Select each option
        for value in values:
            # Find the CommandItem with the matching text
            option = page.locator(f'[role="option"]:has-text("{value}")').first
            option.click()
            time.sleep(0.2)

        # Close the popover by pressing Escape
        page.keyboard.press("Escape")
        time.sleep(0.5)

    @staticmethod
    def select_header_stats(page: Page, column_name: str):
        """
        Get the header stats button locator for a specific column.

        Args:
            page: Playwright page instance
            column_name: Name of the column (e.g., 'iou', 'confidence', 'category_name')

        Returns:
            Locator for the header stats button
        """
        logger.info(f"Selecting header stats locator for column: {column_name}")
        header_stats = page.locator(f'button.header-stats-trigger[data-col-name="{column_name}"]')
        return header_stats
