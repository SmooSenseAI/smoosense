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
        self.app = Flask(__name__)
        self.app.register_blueprint(fs_bp)
        self.app.config["TESTING"] = True
        self.app.config["S3_CLIENT"] = boto3.client("s3")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def _ls(self, path="s3://smoosense-demo/", **kwargs):
        params = {"path": path, **kwargs}
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        response = self.client.get(f"/ls?{qs}")
        return response, json.loads(response.get_data(as_text=True))

    def test_response_shape(self):
        """Response has items/total/offset/limit fields."""
        response, data = self._ls()
        self.assertEqual(response.status_code, 200)
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("offset", data)
        self.assertIn("limit", data)
        self.assertGreater(len(data["items"]), 0)

    def test_item_fields(self):
        """Each item has required fields."""
        response, data = self._ls()
        self.assertEqual(response.status_code, 200)
        for item in data["items"]:
            self.assertIn("name", item)
            self.assertIn("size", item)
            self.assertIn("lastModified", item)
            self.assertIn("isDir", item)

    def test_nested_path(self):
        response, data = self._ls(path="s3://smoosense-demo/datasets/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(data["items"], list)

    def test_with_limit(self):
        response, data = self._ls(limit=2)
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(data["items"]), 2)

    def test_sort_by_name_asc(self):
        response, data = self._ls(sort_by="name", sort_order="asc")
        self.assertEqual(response.status_code, 200)
        names = [i["name"] for i in data["items"]]
        self.assertEqual(names, sorted(names, key=str.lower))

    def test_pagination_total_stable(self):
        _, page1 = self._ls(limit=1, offset=0)
        _, page2 = self._ls(limit=1, offset=1)
        self.assertEqual(page1["total"], page2["total"])

    def test_nonexistent_bucket(self):
        response, data = self._ls(path="s3://this-bucket-definitely-does-not-exist-12345/")
        self.assertEqual(response.status_code, 404)
        self.assertIn("error", data)

    def test_missing_path(self):
        response = self.client.get("/ls")
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
