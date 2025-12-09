import json
import unittest

import boto3
from flask import Flask

from smoosense.handlers.fs import fs_bp
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestS3LSEndpoint(unittest.TestCase):
    """Test cases for the /ls endpoint with S3 paths."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.app = Flask(__name__)
        self.app.register_blueprint(fs_bp)
        self.app.config["TESTING"] = True
        self.app.config["S3_CLIENT"] = boto3.client("s3")
        self.client = self.app.test_client()

        # Set up application context for all tests
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after each test method."""
        self.app_context.pop()

    def test_ls_s3_bucket_root(self):
        """Test listing S3 bucket root."""
        response = self.client.get("/ls?path=s3://smoosense-demo/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

        # Each item should have required fields
        for item in data:
            self.assertIn("name", item)
            self.assertIn("size", item)
            self.assertIn("lastModified", item)
            self.assertIn("isDir", item)

    def test_ls_s3_nested_path(self):
        """Test listing S3 nested path."""
        response = self.client.get("/ls?path=s3://smoosense-demo/datasets/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

    def test_ls_s3_with_limit(self):
        """Test listing S3 with limit parameter."""
        response = self.client.get("/ls?path=s3://smoosense-demo/&limit=2")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)
        self.assertLessEqual(len(data), 2)

    def test_ls_s3_nonexistent_bucket(self):
        """Test listing non-existent S3 bucket returns 404."""
        response = self.client.get("/ls?path=s3://this-bucket-definitely-does-not-exist-12345/")
        self.assertEqual(response.status_code, 404)

        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)
        self.assertIn("NoSuchBucket", data["error"])

    def test_ls_s3_access_denied(self):
        """Test listing S3 bucket without access returns 403."""
        # Use a known bucket that exists but we don't have access to
        response = self.client.get("/ls?path=s3://amazon-reviews-pds/")

        # This should return 403 if access is denied
        # Note: This test depends on not having access to this public bucket
        # If you do have access, this test may pass with 200
        if response.status_code == 403:
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
            self.assertIn("AccessDenied", data["error"])
        else:
            # If we happen to have access, just verify it returns valid data
            self.assertEqual(response.status_code, 200)

    def test_ls_s3_missing_path(self):
        """Test listing without path parameter returns 400."""
        response = self.client.get("/ls")
        self.assertEqual(response.status_code, 400)

        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
