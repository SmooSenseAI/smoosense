import json
import os
import unittest

from my_logging import getLogger

from tests.base_fs_test import BaseFSTest

logger = getLogger(__name__)


class TestLSEndpoint(BaseFSTest):
    """Test cases for the /ls endpoint."""

    def test_get_ls(self):
        """Test the get_ls function through the Flask blueprint route."""
        response = self.client.get(f"/ls?path={self.temp_dir}")
        data = json.loads(response.get_data(as_text=True))

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(data, list)

        # Verify we get the expected items
        names = [item["name"] for item in data]
        self.assertIn("test_file.txt", names)
        self.assertIn("test_dir", names)

    def test_get_ls_access_denied(self):
        """Test access denied error when listing a directory without permissions."""
        import shutil

        # Create test directory with restricted permissions
        restricted_dir = "/tmp/dummy-test"
        if os.path.exists(restricted_dir):
            shutil.rmtree(restricted_dir)

        os.makedirs(restricted_dir, exist_ok=True)

        # Create some test files
        test_file = os.path.join(restricted_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("test content")

        try:
            # Remove all permissions (no read, write, or execute)
            os.chmod(restricted_dir, 0o000)

            # Test should return 403 due to permission denied
            response = self.client.get(f"/ls?path={restricted_dir}")
            logger.error(response.json)
            self.assertEqual(response.status_code, 403)
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
            self.assertIn("Permission denied", data["error"])

        finally:
            # Restore permissions for cleanup
            os.chmod(restricted_dir, 0o755)
            shutil.rmtree(restricted_dir, ignore_errors=True)

    def test_get_ls_not_found(self):
        """Test 404 error when listing a non-existing directory."""
        # Use a path that definitely doesn't exist
        nonexistent_dir = "/tmp/this-directory-does-not-exist-12345"

        # Ensure the directory doesn't exist
        if os.path.exists(nonexistent_dir):
            import shutil

            shutil.rmtree(nonexistent_dir)

        # Test should return 404 for non-existing directory
        response = self.client.get(f"/ls?path={nonexistent_dir}")

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("does not exist", data["error"])


if __name__ == "__main__":
    unittest.main()
