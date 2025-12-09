import json
import unittest

import boto3
from flask import Flask

from smoosense.handlers.s3 import s3_bp
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestS3TypeaheadEndpoint(unittest.TestCase):
    """Test cases for the /s3-typeahead endpoint."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.app = Flask(__name__)
        self.app.register_blueprint(s3_bp)
        self.app.config["TESTING"] = True
        self.app.config["S3_CLIENT"] = boto3.client("s3")
        self.client = self.app.test_client()

        # Set up application context for all tests
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after each test method."""
        self.app_context.pop()

    def test_typeahead_partial_s3_prefix(self):
        """Test typeahead with partial s3:// prefix."""
        for partial in ["s", "s3", "s3:", "s3:/", "s3://"]:
            response = self.client.get(f"/s3-typeahead?path={partial}")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.get_data(as_text=True))
            self.assertTrue(len(data) > 0, f"Should get bucket list for {partial}")
            logger.info(f"s3 ls {data}")
            self.assertIsInstance(data, list)

    def test_typeahead_partial_bucket_name(self):
        """Test typeahead with partial bucket name matches buckets."""
        response = self.client.get("/s3-typeahead?path=s3://smoosense")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should find smoosense-demo bucket
        self.assertTrue(any("smoosense-demo" in s for s in data))

    def test_typeahead_bucket_root(self):
        """Test typeahead listing bucket root contents."""
        response = self.client.get("/s3-typeahead?path=s3://smoosense-demo/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should have some prefixes (directories)
        self.assertGreater(len(data), 0)

        # All should be under smoosense-demo bucket
        for suggestion in data:
            self.assertTrue(suggestion.startswith("s3://smoosense-demo/"))

    def test_typeahead_nested_path(self):
        """Test typeahead with nested path."""
        response = self.client.get("/s3-typeahead?path=s3://smoosense-demo/datasets/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # All should be under datasets/
        for suggestion in data:
            self.assertTrue(suggestion.startswith("s3://smoosense-demo/datasets/"))

    def test_typeahead_partial_prefix_match(self):
        """Test typeahead with partial prefix match inside bucket."""
        response = self.client.get("/s3-typeahead?path=s3://smoosense-demo/data")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertIsInstance(data, list)

        # Should find datasets/ prefix
        self.assertTrue(any("datasets" in s for s in data))

    def test_typeahead_invalid_path(self):
        """Test typeahead with invalid path returns empty list."""
        response = self.client.get("/s3-typeahead?path=/local/path")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data, [])

    def test_typeahead_limit(self):
        """Test that typeahead returns at most 10 suggestions."""
        response = self.client.get("/s3-typeahead?path=s3://smoosense-demo/")
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.get_data(as_text=True))
        self.assertLessEqual(len(data), 10)


if __name__ == "__main__":
    unittest.main()
