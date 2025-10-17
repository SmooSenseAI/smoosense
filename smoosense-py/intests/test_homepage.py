"""Homepage integration tests."""

import sys
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest
from my_logging import getLogger

logger = getLogger(__name__)


class TestHomepage(BaseIntegrationTest):
    """Test cases for the homepage functionality."""

    def test_homepage_loads_successfully(self) -> None:
        """Test that the homepage loads successfully and contains expected content."""

        # Navigate to the homepage
        logger.info(f"Navigating to homepage: {self.base_url}")
        response = self.page.goto(self.base_url)

        # Check that the response was successful
        self.assertIsNotNone(response)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely with a shorter timeout
        try:
            self.page.wait_for_load_state("networkidle", timeout=10000)  # 10 seconds
        except Exception:
            # If networkidle times out, wait for domcontentloaded as fallback
            logger.warning("Network idle timeout, falling back to domcontentloaded")
            self.page.wait_for_load_state("domcontentloaded", timeout=5000)

        # Check that the page has loaded some content (not just a blank page)
        body_content = self.page.locator("body").text_content()
        self.assertIsNotNone(body_content)
        self.assertGreater(len(body_content.strip()), 0, "Page appears to be blank")
        logger.info(f"Page content length: {len(body_content.strip())} characters")

        # Check that the page title is accessible (optional check)
        title = self.page.title()
        logger.info(f"Page title: '{title}'")

        logger.info("Homepage load test completed successfully")

    def test_settings_icon_button_and_popover(self) -> None:
        """Test that the settings icon button exists and shows a popover when clicked."""

        # Navigate to the homepage
        logger.info(f"Navigating to homepage: {self.base_url}")
        response = self.page.goto(self.base_url)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely with a shorter timeout
        try:
            self.page.wait_for_load_state("networkidle", timeout=10000)  # 10 seconds
        except Exception:
            # If networkidle times out, wait for domcontentloaded as fallback
            logger.warning("Network idle timeout, falling back to domcontentloaded")
            self.page.wait_for_load_state("domcontentloaded", timeout=5000)

        # Find the settings button using the exact selector from the UI code
        settings_button = self.page.locator('[data-slot="popover-trigger"][title="Settings"]')

        # Wait for the settings button to appear (up to 5 seconds)
        settings_button.wait_for(timeout=5000)

        # Assert that the settings button exists
        self.assertEqual(settings_button.count(), 1, "Settings button not found on the page")

        # Click the settings button
        settings_button.click()

        # Wait for the popover to appear and find it using the exact selector
        popover = self.page.locator('[data-slot="popover-content"]')

        # Wait for the popover to be visible
        popover.wait_for(state="visible", timeout=5000)

        # Assert that the popover is visible
        self.assertTrue(popover.is_visible(), "Settings popover did not appear")

        # Assert debug mode toggle exists
        logger.info("Checking debug mode toggle")
        debug_toggle = popover.locator('#debugMode-toggle[data-slot="switch"]')
        debug_toggle.wait_for(timeout=5000)  # Wait for debug toggle to appear
        self.assertEqual(debug_toggle.count(), 1, "Debug mode toggle not found")
        debug_state = debug_toggle.get_attribute("data-state")
        self.assertEqual(debug_state, "unchecked", "Debug mode should be off by default")

        # Assert theme button group exists
        logger.info("Checking theme button group")
        theme_buttons = popover.locator(
            'button[title="Light"], button[title="System"], button[title="Dark"]'
        )
        # Wait for at least one theme button to appear
        theme_buttons.first.wait_for(timeout=5000)
        self.assertEqual(theme_buttons.count(), 3, "Theme button group should have 3 buttons")

        # Assert that Dark theme is selected by default
        logger.info("Checking Dark theme selection")
        dark_button = popover.locator('button[title="Dark"]')
        dark_button.wait_for(timeout=5000)  # Wait for dark button to appear
        self.assertEqual(dark_button.count(), 1, "Dark theme button not found")
        dark_classes = dark_button.get_attribute("class") or ""
        self.assertIn("bg-primary", dark_classes, "Dark theme should be selected by default")
        self.assertIn(
            "text-primary-foreground", dark_classes, "Dark theme should have primary styling"
        )
        logger.info("Dark theme is correctly selected")

        # Assert font size slider exists
        logger.info("Checking font size slider")
        font_size_slider = popover.locator("#fontSize-slider")
        font_size_slider.wait_for(timeout=5000)  # Wait for font size slider to appear
        self.assertEqual(font_size_slider.count(), 1, "Font size slider not found")

        # Check that the slider label exists
        font_size_label = popover.locator('label:has-text("Font Size")')
        font_size_label.wait_for(timeout=5000)  # Wait for font size label to appear
        self.assertEqual(font_size_label.count(), 1, "Font size label not found")
        logger.info("Font size slider and label found")

        logger.info("Settings popover test completed successfully")
