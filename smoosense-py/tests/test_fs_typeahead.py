import json
import unittest
from pathlib import Path

from tests.base_fs_test import BaseFSTest


class TestTypeaheadEndpoint(BaseFSTest):
    """Test cases for the /typeahead endpoint."""

    def test_typeahead_with_root_dir(self):
        """Test typeahead using project root directory."""
        # Get the project root directory (smoosense-py)
        root_dir = Path(__file__).parents[1]

        response = self.client.get(f"/typeahead?path={root_dir}/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should contain 'smoosense' directory
        dir_names = [Path(p).name for p in data]
        self.assertIn("smoosense", dir_names)

    def test_typeahead_partial_match(self):
        """Test typeahead with partial directory name."""
        # Get the project root directory
        root_dir = Path(__file__).parents[1]

        # Search for directories starting with 'smoo'
        response = self.client.get(f"/typeahead?path={root_dir}/smoo")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should find 'smoosense' directory
        self.assertTrue(any("smoosense" in p for p in data))

    def test_typeahead_case_insensitive(self):
        """Test typeahead is case-insensitive."""
        root_dir = Path(__file__).parents[1]

        # Search with uppercase
        response = self.client.get(f"/typeahead?path={root_dir}/SMOO")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))

        # Should still find 'smoosense' directory
        self.assertTrue(any("smoosense" in p for p in data))

    def test_typeahead_temp_dir(self):
        """Test typeahead with temp directory from base test."""
        # List contents of temp_dir
        response = self.client.get(f"/typeahead?path={self.temp_dir}/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should contain test_dir (directories only, not files)
        dir_names = [Path(p).name for p in data]
        self.assertIn("test_dir", dir_names)
        # Should not contain test_file.txt (files are excluded)
        self.assertNotIn("test_file.txt", dir_names)

    def test_typeahead_partial_in_temp_dir(self):
        """Test typeahead with partial match in temp directory."""
        response = self.client.get(f"/typeahead?path={self.temp_dir}/test")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))

        # Should find test_dir
        self.assertTrue(any("test_dir" in p for p in data))

    def test_typeahead_nonexistent_dir(self):
        """Test typeahead with non-existent directory returns empty list."""
        response = self.client.get("/typeahead?path=/nonexistent/path/xyz")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data, [])

    def test_typeahead_hidden_dirs_excluded(self):
        """Test that hidden directories are excluded from suggestions."""
        import os

        # Create a hidden directory in temp_dir
        hidden_dir = os.path.join(self.temp_dir, ".hidden_dir")
        os.makedirs(hidden_dir, exist_ok=True)

        response = self.client.get(f"/typeahead?path={self.temp_dir}/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        dir_names = [Path(p).name for p in data]

        # Hidden directory should not be in suggestions
        self.assertNotIn(".hidden_dir", dir_names)

    def test_typeahead_home_path(self):
        """Test typeahead with ~ home path."""
        response = self.client.get("/typeahead?path=~/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should return some directories from home
        # All suggestions should start with ~
        for suggestion in data:
            self.assertTrue(suggestion.startswith("~"))

    def test_typeahead_limit(self):
        """Test that typeahead returns at most 10 suggestions."""
        import os

        # Create many directories
        for i in range(15):
            os.makedirs(os.path.join(self.temp_dir, f"dir_{i:02d}"), exist_ok=True)

        response = self.client.get(f"/typeahead?path={self.temp_dir}/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))

        # Should return at most 10 suggestions
        self.assertLessEqual(len(data), 10)


if __name__ == "__main__":
    unittest.main()
