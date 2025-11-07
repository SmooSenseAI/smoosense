import logging
import os

from pydantic import validate_call

from smoosense.lance.models import TableInfo

logger = logging.getLogger(__name__)


class LanceDBClient:
    """Client for interacting with a Lance database."""

    def __init__(self, root_folder: str):
        """
        Initialize the Lance database client.

        Args:
            root_folder: Path to the Lance database directory
        """
        import lancedb  # Import lancedb lazily since it may be slow at the 1st time

        if root_folder.startswith("~"):
            root_folder = os.path.expanduser(root_folder)

        if not os.path.exists(root_folder):
            raise ValueError(f"Directory does not exist: {root_folder}")

        if not os.path.isdir(root_folder):
            raise ValueError(f"Path is not a directory: {root_folder}")

        self.root_folder = root_folder
        self.db = lancedb.connect(root_folder)
        logger.info(f"Connected to Lance database at {root_folder}")

    @validate_call
    def list_tables(self) -> list[TableInfo]:
        """
        List all tables in the database.

        Returns:
            List of TableInfo models
        """
        table_names = self.db.table_names()
        logger.info(f"Found {len(table_names)} tables: {table_names}")

        tables_info: list[TableInfo] = []
        for table_name in table_names:
            try:
                table = self.db.open_table(table_name)
                cnt_versions = len(table.list_versions())
                cnt_indices = len(table.list_indices())

                tables_info.append(
                    TableInfo(
                        name=table_name,
                        cnt_rows=table.count_rows(),
                        cnt_columns=len(table.schema),
                        cnt_versions=cnt_versions,
                        cnt_indices=cnt_indices,
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to get info for table {table_name}: {e}")
                tables_info.append(
                    TableInfo(
                        name=table_name,
                        cnt_rows=None,
                        cnt_columns=None,
                        cnt_versions=None,
                        cnt_indices=None,
                    )
                )

        return tables_info
