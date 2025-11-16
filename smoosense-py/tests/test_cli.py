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

    def test_sense_with_global_port_option(self) -> None:
        """Test 'sense --port 8080' command (default behavior with port)."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["--port", "8080"])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args

            # Check port was passed correctly
            port = call_args[1]["port"]
            self.assertEqual(port, 8080)
            self.assertEqual(result.exit_code, 0)

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

    def test_sense_db_default_current_directory(self) -> None:
        """Test 'sense db' command (default behavior - db .)."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["db"])

            # Should invoke run_app
            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args
            page_path = call_args[1]["page_path"]

            # Should browse current directory as a database
            expected_path = f"/DB?dbPath={os.getcwd()}&dbType=lance"
            self.assertEqual(page_path, expected_path)
            self.assertEqual(result.exit_code, 0)

    def test_sense_db_current_directory(self) -> None:
        """Test 'sense db .' command."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["db", "."])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args
            page_path = call_args[1]["page_path"]

            expected_path = f"/DB?dbPath={os.getcwd()}&dbType=lance"
            self.assertEqual(page_path, expected_path)
            self.assertEqual(result.exit_code, 0)

    def test_sense_db_specific_directory(self) -> None:
        """Test 'sense db /path/to/db' command."""
        # Create temporary directory for testing
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(main, ["db", tmpdir])

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args
                page_path = call_args[1]["page_path"]

                expected_path = f"/DB?dbPath={os.path.abspath(tmpdir)}&dbType=lance"
                self.assertEqual(page_path, expected_path)
                self.assertEqual(result.exit_code, 0)

    def test_sense_db_with_lance_folders(self) -> None:
        """Test 'sense db' with directory containing .lance folders."""
        # Create temporary directory with .lance folders
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create a .lance directory
            lance_dir = os.path.join(tmpdir, "my_table.lance")
            os.makedirs(lance_dir)

            with patch("smoosense.cli.run_app") as mock_run_app:
                result = self.runner.invoke(main, ["db", tmpdir])

                self.assertTrue(mock_run_app.called)
                call_args = mock_run_app.call_args
                page_path = call_args[1]["page_path"]

                # Should detect lance database type
                expected_path = f"/DB?dbPath={os.path.abspath(tmpdir)}&dbType=lance"
                self.assertEqual(page_path, expected_path)
                self.assertEqual(result.exit_code, 0)

    def test_sense_db_without_lance_folders(self) -> None:
        """Test 'sense db' with directory without .lance folders."""
        # Create temporary directory without .lance folders
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create some non-lance files/folders
            regular_dir = os.path.join(tmpdir, "regular_folder")
            os.makedirs(regular_dir)

            with tempfile.NamedTemporaryFile(dir=tmpdir, suffix=".csv", delete=False) as f:
                temp_file = f.name

            try:
                with patch("smoosense.cli.run_app") as mock_run_app:
                    result = self.runner.invoke(main, ["db", tmpdir])

                    self.assertTrue(mock_run_app.called)
                    call_args = mock_run_app.call_args
                    page_path = call_args[1]["page_path"]

                    # Should default to lance even without .lance folders
                    expected_path = f"/DB?dbPath={os.path.abspath(tmpdir)}&dbType=lance"
                    self.assertEqual(page_path, expected_path)
                    self.assertEqual(result.exit_code, 0)
            finally:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)

    def test_sense_db_nonexistent_directory(self) -> None:
        """Test 'sense db /nonexisting/path' command - should error."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["db", "/nonexisting/path"])

            # Should not call run_app
            self.assertFalse(mock_run_app.called)

            # Should exit with error
            self.assertNotEqual(result.exit_code, 0)

            # Should contain error message about path not existing
            self.assertTrue(
                "does not exist" in result.output.lower() or "path" in result.output.lower()
            )

    def test_sense_db_with_port_option(self) -> None:
        """Test 'sense db' with --port option."""
        with patch("smoosense.cli.run_app") as mock_run_app:
            result = self.runner.invoke(main, ["db", ".", "--port", "8080"])

            self.assertTrue(mock_run_app.called)
            call_args = mock_run_app.call_args

            # Check port was passed correctly
            port = call_args[1]["port"]
            self.assertEqual(port, 8080)
            self.assertEqual(result.exit_code, 0)
