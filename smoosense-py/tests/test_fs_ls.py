import json
import os
import unittest

from smoosense.my_logging import getLogger
from tests.base_fs_test import BaseFSTest

logger = getLogger(__name__)


class TestLSEndpoint(BaseFSTest):
    """Test cases for the /ls endpoint."""

    def setUp(self):
        super().setUp()
        # Add extra files with known sizes and names for sort testing
        for name, size in [("alpha.txt", 100), ("beta.txt", 300), ("gamma.txt", 200)]:
            path = os.path.join(self.temp_dir, name)
            with open(path, "wb") as f:
                f.write(b"x" * size)

    def _ls(self, **kwargs):
        """Helper: call /ls with given params, return parsed JSON."""
        params = {"path": self.temp_dir, **kwargs}
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        response = self.client.get(f"/ls?{qs}")
        self.assertEqual(response.status_code, 200)
        return json.loads(response.get_data(as_text=True))

    def test_response_shape(self):
        """Response is an object with items/total/offset/limit."""
        data = self._ls()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("offset", data)
        self.assertIn("limit", data)
        self.assertIsInstance(data["items"], list)

    def test_items_present(self):
        """Expected files and directories appear in items."""
        data = self._ls()
        names = [item["name"] for item in data["items"]]
        self.assertIn("test_file.txt", names)
        self.assertIn("test_dir", names)

    def test_sort_by_name_asc(self):
        """Items are returned in alphabetical order by default."""
        data = self._ls(sort_by="name", sort_order="asc")
        file_names = [i["name"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(file_names, sorted(file_names, key=str.lower))

    def test_sort_by_name_desc(self):
        """Items are returned in reverse alphabetical order."""
        data = self._ls(sort_by="name", sort_order="desc")
        file_names = [i["name"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(file_names, sorted(file_names, key=str.lower, reverse=True))

    def test_sort_by_size(self):
        """Items sorted by size ascending."""
        data = self._ls(sort_by="size", sort_order="asc")
        sizes = [i["size"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(sizes, sorted(sizes))

    def test_sort_by_size_desc(self):
        """Items sorted by size descending."""
        data = self._ls(sort_by="size", sort_order="desc")
        sizes = [i["size"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(sizes, sorted(sizes, reverse=True))

    def test_sort_by_modified(self):
        """Items sorted by modification time ascending."""
        data = self._ls(sort_by="modified", sort_order="asc")
        timestamps = [i["lastModified"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(timestamps, sorted(timestamps))

    def test_pagination_offset(self):
        """Offset skips the first N items."""
        all_data = self._ls(sort_by="name", sort_order="asc")
        page2_data = self._ls(sort_by="name", sort_order="asc", offset=1, limit=2)
        self.assertEqual(
            [i["name"] for i in page2_data["items"]],
            [i["name"] for i in all_data["items"][1:3]],
        )

    def test_total_is_stable_across_pages(self):
        """Total count is the same regardless of offset."""
        page1 = self._ls(limit=1, offset=0)
        page2 = self._ls(limit=1, offset=1)
        self.assertEqual(page1["total"], page2["total"])

    def test_access_denied(self):
        import shutil

        restricted_dir = "/tmp/dummy-test"
        if os.path.exists(restricted_dir):
            shutil.rmtree(restricted_dir)
        os.makedirs(restricted_dir, exist_ok=True)
        with open(os.path.join(restricted_dir, "test.txt"), "w") as f:
            f.write("x")
        try:
            os.chmod(restricted_dir, 0o000)
            response = self.client.get(f"/ls?path={restricted_dir}")
            self.assertEqual(response.status_code, 403)
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
        finally:
            os.chmod(restricted_dir, 0o755)
            shutil.rmtree(restricted_dir, ignore_errors=True)

    def test_not_found(self):
        nonexistent = "/tmp/this-does-not-exist-12345"
        if os.path.exists(nonexistent):
            import shutil

            shutil.rmtree(nonexistent)
        response = self.client.get(f"/ls?path={nonexistent}")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
