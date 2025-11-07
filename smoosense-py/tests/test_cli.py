"""
Tests for SmooSense CLI commands.
"""

import os
import tempfile
import unittest
from unittest.mock import patch

from click.testing import CliRunner

from smoosense.cli import main
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestCLI(unittest.TestCase):
    """Test suite for SmooSense CLI commands."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        self.runner = CliRunner()
        logger.info(f"Running test: {self._testMethodName}")

    def test_sense_default_command(self) -> None:
        """Test 'sense' command (default behavior - folder .)."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, [])

            # Should invoke run_app
            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args
            page_path = call_args[1]["page_path"]

            # Should browse current directory
            expected_path = f"/FolderBrowser?rootFolder={os.getcwd()}"
            self.assertEqual(page_path, expected_path)
            self.assertEqual(result.exit_code, 0)

    def test_sense_folder_current_directory(self) -> None:
        """Test 'sense folder .' command."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["folder", "."])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args
            page_path = call_args[1]["page_path"]

            expected_path = f"/FolderBrowser?rootFolder={os.getcwd()}"
            self.assertEqual(page_path, expected_path)
            self.assertEqual(result.exit_code, 0)

    def test_sense_folder_tmp_path(self) -> None:
        """Test 'sense folder /tmp/path' command."""
        # Create temporary directory for testing
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(main, ["folder", tmpdir])

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args
                page_path = call_args[1]["page_path"]

                expected_path = f"/FolderBrowser?rootFolder={os.path.abspath(tmpdir)}"
                self.assertEqual(page_path, expected_path)
                self.assertEqual(result.exit_code, 0)

    def test_sense_folder_home_downloads(self) -> None:
        """Test 'sense folder ~/Downloads' command."""
        downloads_path = os.path.expanduser("~/Downloads")

        # Skip test if Downloads doesn't exist
        if not os.path.exists(downloads_path):
            return

        # Click doesn't expand ~ automatically, so we need to use the expanded path
        # In real shell usage, the shell expands ~ before passing to the command
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["folder", downloads_path])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args
            page_path = call_args[1]["page_path"]

            expected_path = f"/FolderBrowser?rootFolder={os.path.abspath(downloads_path)}"
            self.assertEqual(page_path, expected_path)
            self.assertEqual(result.exit_code, 0)

    def test_sense_table_relative_path(self) -> None:
        """Test 'sense table ./path/file.csv' command."""
        # Create temporary CSV file
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as f:
            temp_file = f.name

        try:
            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(main, ["table", temp_file])

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args
                page_path = call_args[1]["page_path"]

                expected_path = f"/Table?tablePath={os.path.abspath(temp_file)}"
                self.assertEqual(page_path, expected_path)
                self.assertEqual(result.exit_code, 0)
        finally:
            # Cleanup
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_sense_table_nonexistent_file(self) -> None:
        """Test 'sense table /nonexisting/file.csv' command - should error."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["table", "/nonexisting/file.csv"])

            # Should not call run_app
            self.assertFalse(mock_run_app.called)

            # Should exit with error
            self.assertNotEqual(result.exit_code, 0)

            # Should contain error message about path not existing
            self.assertTrue(
                "does not exist" in result.output.lower() or "path" in result.output.lower()
            )

    def test_sense_table_absolute_path_parquet(self) -> None:
        """Test 'sense table /abs/path/file.parquet' command."""
        # Create temporary parquet file
        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as f:
            temp_file = f.name

        try:
            abs_path = os.path.abspath(temp_file)

            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(main, ["table", abs_path])

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args
                page_path = call_args[1]["page_path"]

                expected_path = f"/Table?tablePath={abs_path}"
                self.assertEqual(page_path, expected_path)
                self.assertEqual(result.exit_code, 0)
        finally:
            # Cleanup
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_sense_version(self) -> None:
        """Test 'sense --version' command."""
        result = self.runner.invoke(main, ["--version"])

        self.assertEqual(result.exit_code, 0)
        self.assertIn("sense, version", result.output)

    def test_sense_folder_with_port_option(self) -> None:
        """Test 'sense folder' with --port option."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["folder", ".", "--port", "8080"])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args

            # Check port was passed correctly
            port = call_args[1]["port"]
            self.assertEqual(port, 8080)
            self.assertEqual(result.exit_code, 0)

    def test_sense_table_with_url_prefix_option(self) -> None:
        """Test 'sense table' with --url-prefix option."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as f:
            temp_file = f.name

        try:
            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(
                    main, ["table", temp_file, "--url-prefix", "/smoosense"]
                )

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args

                # Check url_prefix was passed correctly
                url_prefix = call_args[1]["url_prefix"]
                self.assertEqual(url_prefix, "/smoosense")
                self.assertEqual(result.exit_code, 0)
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
