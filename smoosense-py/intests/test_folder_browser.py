"""FolderBrowser integration tests.

For screenshot capture, see screenshot_folder_browser.py
"""

import sys
import time
from pathlib import Path

# Add the intests directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from base_integration_test import BaseIntegrationTest

from smoosense.my_logging import getLogger

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

        # Double-click on the data folder to expand it
        data_node.dblclick()
        logger.info("Double-clicked on data folder")

        # Wait a moment for expansion to complete
        time.sleep(1)

        # Assert that the data folder is expanded and shows expected parquet files
        expected_files = ["compare-video-generation.parquet", "dummy_data_various_types.parquet"]
        for filename in expected_files:
            file_node = self.page.locator(f'span[title="{filename}"]')
            self.assertEqual(file_node.count(), 1, f"{filename} not found after expansion")

        logger.info("Found expected parquet files in expanded data folder")
        logger.info("Data folder expansion test completed successfully")

    def test_sharable_link_with_viewing_images(self) -> None:
        """Test that sharable link with viewing parameter works for image folders."""
        # URL with viewing parameter pointing to a folder with images
        url = f"{self.server.base_url}/FolderBrowser?rootFolder=s3://smoosense-demo&viewing=datasets/Oxford_Flowers_102/alpine+sea+holly"
        logger.info(f"Testing sharable link with images: {url}")

        # Navigate to the URL
        response = self.page.goto(url)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Wait additional time for tree expansion and preview to load
        time.sleep(3)

        # Assert that all parent folders are visible in the tree view
        logger.info("Checking for parent folders in tree view...")

        datasets_node = self.page.locator('span[title="datasets"]')
        self.assertGreaterEqual(
            datasets_node.count(), 1, "datasets folder not visible in tree view"
        )
        logger.info("Found 'datasets' folder in tree view")

        oxford_node = self.page.locator('span[title="Oxford_Flowers_102"]')
        self.assertGreaterEqual(
            oxford_node.count(), 1, "Oxford_Flowers_102 folder not visible in tree view"
        )
        logger.info("Found 'Oxford_Flowers_102' folder in tree view")

        alpine_node = self.page.locator('span[title="alpine sea holly"]')
        self.assertGreaterEqual(
            alpine_node.count(), 1, "alpine sea holly folder not visible in tree view"
        )
        logger.info("Found 'alpine sea holly' folder in tree view")

        # Assert that there are images in the right preview panel
        logger.info("Checking for images in preview panel...")

        # Look for image elements - check for img tags in general
        images = self.page.locator("img")
        self.assertGreater(images.count(), 0, "No images found in preview panel")
        logger.info(f"Found {images.count()} image(s) in preview panel")

        logger.info("Sharable link with images test completed successfully")

    def test_sharable_link_with_viewing_audio(self) -> None:
        """Test that sharable link with viewing parameter works for audio files."""
        # URL with viewing parameter pointing to an audio file
        url = f"{self.server.base_url}/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=audio-files/1-15689-B-4-frog.wav"
        logger.info(f"Testing sharable link with audio: {url}")

        # Navigate to the URL
        response = self.page.goto(url)
        self.assertEqual(response.status, 200)

        # Wait for the page to load completely
        self.page.wait_for_load_state("networkidle")

        # Wait additional time for tree expansion and preview to load
        time.sleep(3)

        # Assert that parent folder and file are visible in the tree view
        logger.info("Checking for audio folder and file in tree view...")

        audio_folder_node = self.page.locator('span[title="audio-files"]')
        self.assertGreaterEqual(
            audio_folder_node.count(), 1, "audio-files folder not visible in tree view"
        )
        logger.info("Found 'audio-files' folder in tree view")

        audio_file_node = self.page.locator('span[title="1-15689-B-4-frog.wav"]')
        self.assertGreaterEqual(
            audio_file_node.count(), 1, "1-15689-B-4-frog.wav not visible in tree view"
        )
        logger.info("Found '1-15689-B-4-frog.wav' in tree view")

        # Assert that there is an audio player in the right preview panel
        logger.info("Checking for audio player in preview panel...")

        # Look for audio elements - HTML5 audio player or custom audio player components
        audio_players = self.page.locator(
            'audio, [data-testid*="audio"], canvas[class*="mel"], canvas[class*="spectrogram"]'
        )
        self.assertGreater(audio_players.count(), 0, "No audio player found in preview panel")
        logger.info(f"Found {audio_players.count()} audio player element(s) in preview panel")

        logger.info("Sharable link with audio test completed successfully")
