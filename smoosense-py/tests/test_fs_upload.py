import json
import os
import unittest
from unittest.mock import Mock, patch

from my_logging import getLogger

from tests.base_fs_test import BaseFSTest

logger = getLogger(__name__)


class TestUploadEndpoint(BaseFSTest):
    """Test cases for the /upload endpoint."""

    def test_upload_file_success(self):
        """Test successful file upload to local filesystem."""
        # Use a file path in the temp directory
        upload_path = os.path.join(self.temp_dir, "uploaded_file.txt")
        content = "This is test content for upload"

        response = self.client.post(
            "/upload", json={"content": content}, query_string={"path": upload_path}
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data["status"], "success")

        # Verify the file was actually created with correct content
        self.assertTrue(os.path.exists(upload_path))
        with open(upload_path) as f:
            actual_content = f.read()
        self.assertEqual(actual_content, content)

    def test_upload_file_create_directories(self):
        """Test that upload creates parent directories automatically."""
        # Use a nested path that doesn't exist
        upload_path = os.path.join(self.temp_dir, "nested", "deep", "new_file.txt")
        content = "Content in nested directory"

        # Ensure parent directories don't exist
        parent_dir = os.path.dirname(upload_path)
        self.assertFalse(os.path.exists(parent_dir))

        response = self.client.post(
            "/upload", json={"content": content}, query_string={"path": upload_path}
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data["status"], "success")

        # Verify directories were created and file exists
        self.assertTrue(os.path.exists(parent_dir))
        self.assertTrue(os.path.exists(upload_path))
        with open(upload_path) as f:
            actual_content = f.read()
        self.assertEqual(actual_content, content)

    def test_upload_file_missing_path_parameter(self):
        """Test upload without path parameter returns 400 error."""
        content = "Test content"

        response = self.client.post("/upload", json={"content": content})

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("Missing required parameter: path", data["error"])

    def test_upload_file_missing_content(self):
        """Test upload without content in JSON body returns error."""
        upload_path = os.path.join(self.temp_dir, "test_file.txt")

        response = self.client.post(
            "/upload",
            json={},  # Missing content field
            query_string={"path": upload_path},
        )

        # This should return 500 as it tries to access request.json["content"]
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("Invalid content", data["error"])

    def test_upload_file_invalid_json(self):
        """Test upload with invalid JSON returns error."""
        upload_path = os.path.join(self.temp_dir, "test_file.txt")

        response = self.client.post(
            "/upload",
            data="invalid json",
            content_type="application/json",
            query_string={"path": upload_path},
        )

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn(
            "The browser (or proxy) sent a request that this server could not understand.",
            data["error"],
        )

    def test_upload_file_permission_denied(self):
        """Test upload to a location without write permissions."""
        # Create a directory without write permissions
        restricted_dir = "/tmp/upload-test-restricted"
        if os.path.exists(restricted_dir):
            import shutil

            shutil.rmtree(restricted_dir)

        os.makedirs(restricted_dir, exist_ok=True)
        upload_path = os.path.join(restricted_dir, "test_file.txt")

        try:
            # Remove write permissions
            os.chmod(restricted_dir, 0o444)  # Read-only

            response = self.client.post(
                "/upload", json={"content": "test content"}, query_string={"path": upload_path}
            )

            self.assertEqual(response.status_code, 403)
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
            self.assertIn("Permission denied", data["error"])

        finally:
            # Restore permissions for cleanup
            os.chmod(restricted_dir, 0o755)
            import shutil

            shutil.rmtree(restricted_dir, ignore_errors=True)

    @patch("smoosense.handlers.fs.S3FileSystem")
    @patch("smoosense.handlers.fs.current_app")
    def test_upload_file_s3_success(self, mock_current_app, mock_s3_fs_class):
        """Test successful file upload to S3."""
        # Mock S3 client and file system
        mock_s3_client = Mock()
        mock_current_app.config = {"S3_CLIENT": mock_s3_client}

        mock_s3_fs = Mock()
        mock_s3_fs_class.return_value = mock_s3_fs
        mock_s3_fs.put_file.return_value = None  # Successful upload

        s3_path = "s3://sense-table-demo/internal/persisted-state/dummy-test.txt"
        content = "Test content for S3 upload"

        response = self.client.post(
            "/upload", json={"content": content}, query_string={"path": s3_path}
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data["status"], "success")

        # Verify S3FileSystem was called correctly
        mock_s3_fs_class.assert_called_once_with(mock_s3_client)
        mock_s3_fs.put_file.assert_called_once_with(s3_path, content)

    @patch("smoosense.handlers.fs.S3FileSystem")
    @patch("smoosense.handlers.fs.current_app")
    def test_upload_file_s3_access_denied(self, mock_current_app, mock_s3_fs_class):
        """Test S3 upload with access denied error."""
        # Mock S3 client and file system
        mock_s3_client = Mock()
        mock_current_app.config = {"S3_CLIENT": mock_s3_client}

        mock_s3_fs = Mock()
        mock_s3_fs_class.return_value = mock_s3_fs

        # Mock ClientError for access denied
        from botocore.exceptions import ClientError

        error_response = {"Error": {"Code": "AccessDenied", "Message": "Access Denied"}}
        mock_s3_fs.put_file.side_effect = ClientError(error_response, "PutObject")

        s3_path = "s3://sense-table-demo/internal/persisted-state/dummy-test.txt"
        content = "Test content for S3 upload"

        response = self.client.post(
            "/upload", json={"content": content}, query_string={"path": s3_path}
        )

        self.assertEqual(response.status_code, 403)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("Access", data["error"])

        # Verify S3FileSystem was called
        mock_s3_fs_class.assert_called_once_with(mock_s3_client)
        mock_s3_fs.put_file.assert_called_once_with(s3_path, content)


if __name__ == "__main__":
    unittest.main()
