import os
import unittest

import lancedb

from smoosense.lance.db_client import LanceDBClient
from smoosense.lance.table_client import LanceTableClient
from smoosense.my_logging import getLogger

logger = getLogger(__name__)
PWD = os.path.dirname(__file__)


class TestLanceDb(unittest.TestCase):
    def setUp(self):
        self.data_uri = os.path.join(PWD, "../../data/lance/")
        self.db = lancedb.connect(self.data_uri)
        self.table_name = "dummy_data_various_types"

    def test_read(self):
        self.assertListEqual([self.table_name], self.db.table_names() or [])
        table = self.db.open_table(self.table_name)
        versions = table.list_versions()
        self.assertEqual(len(versions), 4)


class TestLanceDBClient(unittest.TestCase):
    """Test cases for LanceDBClient"""

    def setUp(self):
        self.data_uri = os.path.join(PWD, "../../data/lance/")
        self.table_name = "dummy_data_various_types"

    def test_list_tables(self):
        """Test that DB client can get the table"""
        client = LanceDBClient(self.data_uri)
        tables = client.list_tables()
        table_names = [table.name for table in tables]
        self.assertIn(self.table_name, table_names)


class TestLanceTableClient(unittest.TestCase):
    """Test cases for LanceTableClient"""

    def setUp(self):
        self.data_uri = os.path.join(PWD, "../../data/lance/")
        self.table_name = "dummy_data_various_types"

    def test_list_versions(self):
        """Test that table client can list 4 versions"""
        client = LanceTableClient(self.data_uri, self.table_name)
        versions = client.list_versions()
        self.assertEqual(len(versions), 4)


if __name__ == "__main__":
    unittest.main()
