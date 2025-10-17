import json
import os
import unittest

from my_logging import getLogger

from tests.base_fs_test import BaseFSTest

logger = getLogger(__name__)


class TestGetFileEndpoint(BaseFSTest):
    """Test cases for the /get-file endpoint."""

    def test_get_file_missing_path_parameter(self):
        """Test that get_file without a path parameter returns 400 error."""
        response = self.client.get("/get-file")

        # Should return 400 error with proper error message
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("Missing required parameter: path", data["error"])

    def test_get_file_access_denied(self):
        """Test access denied error when accessing a file without read permissions."""

        # Create test file with restricted permissions
        restricted_file = "/tmp/dummy-test-file.txt"
        if os.path.exists(restricted_file):
            os.remove(restricted_file)

        # Create the test file
        with open(restricted_file, "w") as f:
            f.write("secret content")

        try:
            # Remove read permissions (no read access)
            os.chmod(restricted_file, 0o000)

            # Test should return 403 due to permission denied
            response = self.client.get(f"/get-file?path={restricted_file}")

            self.assertEqual(response.status_code, 403)
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
            self.assertIn("Permission denied", data["error"])

        finally:
            # Restore permissions for cleanup
            os.chmod(restricted_file, 0o644)
            if os.path.exists(restricted_file):
                os.remove(restricted_file)

    def test_get_file_not_found(self):
        """Test 404 error when accessing a non-existing file."""
        # Use a path that definitely doesn't exist
        nonexistent_file = "/tmp/this-file-does-not-exist-12345.txt"

        # Ensure the file doesn't exist
        if os.path.exists(nonexistent_file):
            os.remove(nonexistent_file)

        # Test should return 404 for non-existing file
        response = self.client.get(f"/get-file?path={nonexistent_file}")

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("No such file", data["error"])


if __name__ == "__main__":
    unittest.main()
