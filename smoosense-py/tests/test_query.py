import json
import unittest

from my_logging import getLogger

from smoosense.app import SmooSenseApp

logger = getLogger(__name__)


class TestQueryEndpoint(unittest.TestCase):
    """Test cases for the query API endpoint"""

    def setUp(self):
        """Set up test Flask app"""
        self.app_instance = SmooSenseApp()
        self.app = self.app_instance.create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_successful_query_returns_200(self):
        """Test that a simple SELECT query returns HTTP 200"""
        query_payload = {"query": "SELECT 1 as test_column"}

        response = self.client.post("/api/query", json=query_payload)

        self.assertEqual(response.status_code, 200)

        # Verify response structure
        response_data = response.get_json()
        print(json.dumps(response_data, indent=2))
        logger.info(response_data)
        self.assertEqual(response_data["status"], "success")
        self.assertIn("column_names", response_data)
        self.assertIn("rows", response_data)
        self.assertIn("runtime", response_data)
        self.assertIsNone(response_data["error"])

        # Verify query result
        self.assertEqual(response_data["column_names"], ["test_column"])
        self.assertEqual(response_data["rows"], [[1]])

    def test_update_query_returns_403(self):
        """Test that an UPDATE query returns HTTP 403 (forbidden)"""
        query_payload = {"query": "UPDATE test_table SET column1 = 'value' WHERE id = 1"}

        response = self.client.post("/api/query", json=query_payload)

        self.assertEqual(response.status_code, 403)

        # Verify error response structure
        response_data = response.get_json()
        self.assertIn("error", response_data)
        self.assertEqual(response_data["error"], "You are only allowed to run readonly queries")
        self.assertIn("exception", response_data)
        self.assertEqual(response_data["exception"], "builtins.PermissionError")


if __name__ == "__main__":
    unittest.main()
