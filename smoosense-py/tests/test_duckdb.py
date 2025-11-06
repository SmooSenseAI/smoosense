import unittest

from smoosense.my_logging import getLogger
from smoosense.utils.duckdb_connections import check_permissions

logger = getLogger(__name__)


class TestCheckPermissions(unittest.TestCase):
    """Test cases for the check_permissions function"""

    def test_allowed_queries(self):
        """Test that normal SELECT queries are allowed"""
        allowed_queries = [
            "SELECT * FROM table",
            "SELECT name, age FROM users WHERE age > 18",
            "SELECT COUNT(*) FROM orders",
            "SELECT DISTINCT category FROM products",
            "SELECT * FROM table1 JOIN table2 ON table1.id = table2.id",
            "SELECT * FROM table WHERE name LIKE '%test%'",
            "SELECT * FROM table ORDER BY name ASC",
            "SELECT * FROM table GROUP BY category",
            "SELECT * FROM table LIMIT 10",
            "SELECT * FROM table OFFSET 5",
        ]

        for query in allowed_queries:
            with self.subTest(query=query):
                # Should not raise any exception
                check_permissions(query)

    def test_forbidden_copy_keyword(self):
        """Test that COPY queries are forbidden"""
        forbidden_queries = [
            "COPY table TO 'file.csv'",
            "COPY (SELECT * FROM table) TO 'output.csv'",
            "COPY table TO 'file.csv' WITH (FORMAT csv)",
            "COPY table FROM 'file.csv'",
            "SELECT * FROM table; COPY table TO 'file.csv'",
            "copy table to 'file.csv'",  # Case insensitive
            "Copy Table To 'file.csv'",  # Mixed case
            "COPY TABLE TO 'file.csv'",  # Upper case
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )

    def test_forbidden_export_keyword(self):
        """Test that EXPORT queries are forbidden"""
        forbidden_queries = [
            "EXPORT DATABASE 'backup.db'",
            "EXPORT TABLE table TO 'file.csv'",
            "export database 'backup.db'",  # Case insensitive
            "Export Database 'backup.db'",  # Mixed case
            "EXPORT DATABASE 'backup.db'",  # Upper case
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )

    def test_forbidden_delete_keyword(self):
        """Test that DELETE queries are forbidden"""
        forbidden_queries = [
            "DELETE FROM table",
            "DELETE FROM table WHERE id = 1",
            "DELETE FROM table WHERE name = 'test'",
            "delete from table",  # Case insensitive
            "Delete From Table",  # Mixed case
            "DELETE FROM TABLE",  # Upper case
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )

    def test_forbidden_attach_keyword(self):
        """Test that ATTACH queries are forbidden"""
        forbidden_queries = [
            "ATTACH DATABASE 'other.db' AS other",
            "ATTACH 'other.db' AS other",
            "attach database 'other.db' as other",  # Case insensitive
            "Attach Database 'other.db' As Other",  # Mixed case
            "ATTACH DATABASE 'OTHER.DB' AS OTHER",  # Upper case
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )

    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        # Empty query
        check_permissions("")

        # Query with only whitespace
        check_permissions("   \t\n  ")

        # Query with multiple spaces
        check_permissions("SELECT    *    FROM    table")

        # Query with newlines
        check_permissions("SELECT *\nFROM table\nWHERE id = 1")

        # Query with tabs
        check_permissions("SELECT\t*\tFROM\ttable")

        # Query with mixed whitespace
        check_permissions(
            "SELECT * FROM table WHERE name LIKE '%copy%'"
        )  # 'copy' as part of a string

    def test_partial_matches(self):
        """Test that partial matches don't trigger the forbidden check"""
        # These should be allowed even though they contain parts of forbidden words
        allowed_queries = [
            "SELECT * FROM copy_table",  # 'copy' as part of table name
            "SELECT * FROM exported_data",  # 'export' as part of table name
            "SELECT * FROM deleted_records",  # 'delete' as part of table name
            "SELECT * FROM attached_files",  # 'attach' as part of table name
            "SELECT * FROM updated_records",  # 'update' as part of table name
            "SELECT * FROM table WHERE description LIKE '%copy%'",  # 'copy' in string literal
            "SELECT * FROM table WHERE action = 'exported'",  # 'export' in string literal
            "SELECT * FROM table WHERE status = 'deleted'",  # 'delete' in string literal
            "SELECT * FROM table WHERE type = 'attached'",  # 'attach' in string literal
            "SELECT * FROM table WHERE last_updated > '2023-01-01'",  # 'update' in string literal
        ]

        for query in allowed_queries:
            with self.subTest(query=query):
                # Should not raise any exception
                check_permissions(query)

    def test_forbidden_update_keyword(self):
        """Test that UPDATE queries are forbidden"""
        forbidden_queries = [
            "UPDATE table SET column = 'value'",
            "UPDATE table SET column = 'value' WHERE id = 1",
            "UPDATE table SET col1 = 'val1', col2 = 'val2'",
            "update table set column = 'value'",  # Case insensitive
            "Update Table Set Column = 'Value'",  # Mixed case
            "UPDATE TABLE SET COLUMN = 'VALUE'",  # Upper case
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )

    def test_multiple_forbidden_keywords(self):
        """Test queries with multiple forbidden keywords"""
        forbidden_queries = [
            "COPY table TO 'file.csv'; DELETE FROM table",
            "EXPORT DATABASE 'backup.db'; ATTACH DATABASE 'other.db'",
            "DELETE FROM table; COPY result TO 'output.csv'",
            "ATTACH DATABASE 'db.db'; EXPORT TABLE table TO 'file.csv'",
            "UPDATE table SET col = 'val'; DELETE FROM table",
            "COPY table TO 'file.csv'; UPDATE table SET col = 'val'",
        ]

        for query in forbidden_queries:
            with self.subTest(query=query):
                with self.assertRaises(PermissionError) as context:
                    check_permissions(query)
                self.assertEqual(
                    str(context.exception), "You are only allowed to run readonly queries"
                )


if __name__ == "__main__":
    unittest.main()
