import os
import unittest

from my_logging import getLogger

from smoosense.utils.duckdb_connections import check_permissions
import lancedb


logger = getLogger(__name__)
PWD = os.path.dirname(__file__)

class TestLanceDb(unittest.TestCase):
    def setUp(self):
        self.data_uri = os.path.join(PWD, '../../data/lance/')
        self.db = lancedb.connect(self.data_uri)
        self.table_name = 'dummy_data_various_types'

    def test_read(self):
        self.assertListEqual([self.table_name], self.db.table_names() or [])
        table = self.db.open_table(self.table_name)
        versions = table.list_versions()
        self.assertEqual(len(versions), 1)


if __name__ == "__main__":
    unittest.main()
