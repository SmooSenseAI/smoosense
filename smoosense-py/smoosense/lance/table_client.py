import logging
import os
from typing import Optional

import duckdb
import lancedb
import pyarrow as pa
from pydantic import validate_call

from smoosense.lance.models import VersionInfo

logger = logging.getLogger(__name__)


class LanceTableClient:
    """Client for interacting with a Lance table."""

    def __init__(self, root_folder: str, table_name: str):
        """
        Initialize the Lance table client.

        Args:
            root_folder: Path to the Lance database directory
            table_name: Name of the table
        """
        if root_folder.startswith("~"):
            root_folder = os.path.expanduser(root_folder)

        if not os.path.exists(root_folder):
            raise ValueError(f"Directory does not exist: {root_folder}")

        if not os.path.isdir(root_folder):
            raise ValueError(f"Path is not a directory: {root_folder}")

        self.root_folder = root_folder
        self.table_name = table_name
        self.db = lancedb.connect(root_folder)
        self.table = self.db.open_table(table_name)

        # Cache for filtered Arrow table to avoid re-conversion on multiple queries
        self._filtered_arrow_table: Optional[pa.Table] = None
        self._incompatible_columns: Optional[list[str]] = None

        logger.info(f"Connected to Lance table '{table_name}' at {root_folder}")

    @staticmethod
    def from_table_path(table_path: str) -> "LanceTableClient":
        """
        Create a LanceTableClient from a table path.

        Args:
            table_path: Path to the Lance table (e.g., /path/to/db/table_name.lance)

        Returns:
            LanceTableClient instance

        Raises:
            ValueError: If the table path is invalid or doesn't end with .lance
        """
        # Expand ~ if present
        if table_path.startswith("~"):
            table_path = os.path.expanduser(table_path)

        # Validate path exists
        if not os.path.exists(table_path):
            raise ValueError(f"Table path does not exist: {table_path}")

        # Validate path ends with .lance
        if not table_path.endswith(".lance"):
            raise ValueError(f"Table path must end with .lance: {table_path}")

        # Extract root folder and table name
        root_folder = os.path.dirname(table_path)
        table_name = os.path.basename(table_path).replace(".lance", "")

        return LanceTableClient(root_folder, table_name)

    def _filter_duckdb_incompatible_columns(
        self, arrow_table: pa.Table
    ) -> tuple[pa.Table, list[str]]:
        """
        Filter out columns with DuckDB-incompatible Arrow types.

        Args:
            arrow_table: PyArrow table to filter

        Returns:
            Tuple of (filtered_arrow_table, incompatible_column_names)

        Raises:
            ValueError: If no compatible columns found
        """
        compatible_columns = []
        incompatible_columns = []

        for field in arrow_table.schema:
            field_type = field.type

            # Check for DuckDB-incompatible types
            is_incompatible = (
                # halffloat (float16) is not supported
                pa.types.is_float16(field_type)
                or
                # Extension types are often not supported
                isinstance(field_type, pa.ExtensionType)
                or
                # Duration types may not be supported
                pa.types.is_duration(field_type)
                or
                # Large binary/string types (64-bit offsets)
                pa.types.is_large_binary(field_type)
                or pa.types.is_large_string(field_type)
                or pa.types.is_large_list(field_type)
            )

            if is_incompatible:
                incompatible_columns.append(field.name)
                logger.warning(
                    f"Skipping column '{field.name}' with unsupported type: {field_type}"
                )
            else:
                compatible_columns.append(field.name)

        if not compatible_columns:
            raise ValueError("No compatible columns found in Lance table for DuckDB")

        # Select only compatible columns
        filtered_arrow_table = arrow_table.select(compatible_columns)

        return filtered_arrow_table, incompatible_columns

    def _get_filtered_arrow_table(self) -> pa.Table:
        """
        Get the filtered Arrow table with DuckDB-compatible columns only.

        Uses cached version if available to avoid re-conversion on multiple queries.

        Returns:
            Filtered PyArrow table

        Raises:
            ValueError: If no compatible columns found
        """
        if self._filtered_arrow_table is None:
            logger.info(
                f"Converting Lance table '{self.table_name}' to Arrow and filtering columns"
            )

            # Convert Lance table to Arrow table
            arrow_table = self.table.to_arrow()

            # Filter incompatible columns
            (
                self._filtered_arrow_table,
                self._incompatible_columns,
            ) = self._filter_duckdb_incompatible_columns(arrow_table)

            if self._incompatible_columns:
                logger.info(
                    f"Filtered out {len(self._incompatible_columns)} incompatible column(s): {', '.join(self._incompatible_columns)}"
                )
            else:
                logger.info("All columns are compatible with DuckDB")

        return self._filtered_arrow_table

    def run_duckdb_sql(self, query: str) -> tuple[list[str], list[tuple]]:
        """
        Execute a SQL query against the Lance table using DuckDB.

        The table is registered as 'lance_table' in DuckDB.
        Uses cached Arrow table conversion to avoid repeated conversions on multiple queries.

        Args:
            query: SQL query to execute (use 'lance_table' to reference the table)

        Returns:
            Tuple of (column_names, rows) where:
                - column_names is a list of column name strings
                - rows is a list of tuples containing the row data

        Raises:
            ValueError: If no compatible columns found or query execution fails
        """
        logger.info(f"Executing DuckDB query on Lance table {self.table_name}")

        # Get filtered Arrow table (uses cache if available)
        filtered_arrow_table = self._get_filtered_arrow_table()

        # Create DuckDB connection and register the filtered Arrow table
        con = duckdb.connect()
        con.register("lance_table", filtered_arrow_table)

        # Execute the query
        result = con.execute(query)
        column_names = [desc[0] for desc in result.description] if result.description else []
        rows = result.fetchall()

        # Close the connection
        con.close()

        logger.info(f"Query executed successfully: {len(rows)} rows, {len(column_names)} columns")

        return column_names, rows

    @staticmethod
    def _extract_int_from_metadata(metadata: dict, key: str, default: int = 0) -> int:
        """
        Extract an integer value from metadata, handling various data types.

        Args:
            metadata: Metadata dictionary
            key: Key to extract
            default: Default value if extraction fails

        Returns:
            Integer value or default
        """
        try:
            return int(metadata.get(key, default) or default)
        except (ValueError, TypeError):
            return default

    @validate_call
    def list_versions(self) -> list[VersionInfo]:
        """
        List all versions of the table.

        Returns:
            List of VersionInfo models sorted by version number
        """
        logger.info(f"Fetching versions for table {self.table_name}")
        version_list = self.table.list_versions()

        # Ensure versions are sorted by version number increasingly
        version_list = sorted(version_list, key=lambda v: int(v["version"]))

        versions_info: list[VersionInfo] = []
        prev_data_rows = 0
        prev_deletion_rows = 0
        prev_columns: set[str] = set()

        for version in version_list:
            timestamp = version["timestamp"]
            # Convert datetime to Unix timestamp (epoch) if needed
            if hasattr(timestamp, "timestamp"):
                timestamp = int(timestamp.timestamp())
            else:
                timestamp = int(timestamp)

            metadata = version.get("metadata", {})

            # Extract total_rows from metadata using helper function
            total_data_rows = self._extract_int_from_metadata(metadata, "total_data_file_rows")
            total_deletion_rows = self._extract_int_from_metadata(
                metadata, "total_deletion_file_rows"
            )

            # Calculate diffs
            rows_add = total_data_rows - prev_data_rows
            rows_remove = total_deletion_rows - prev_deletion_rows

            # Get schema for this version to calculate column differences
            try:
                # Use to_lance() to access the dataset at a specific version
                dataset = self.table.to_lance()
                version_dataset = dataset.checkout_version(version["version"])
                current_columns = set(version_dataset.schema.names)
            except Exception as e:
                logger.warning(f"Failed to get schema for version {version['version']}: {e}")
                current_columns = set()

            # Calculate column differences
            columns_add = list(current_columns - prev_columns) if prev_columns else []
            columns_remove = list(prev_columns - current_columns) if prev_columns else []

            versions_info.append(
                VersionInfo(
                    version=version["version"],
                    timestamp=timestamp,
                    metadata=metadata,
                    total_rows=total_data_rows,
                    rows_add=rows_add,
                    rows_remove=rows_remove,
                    columns_add=columns_add,
                    columns_remove=columns_remove,
                )
            )

            # Update previous values for next iteration
            prev_data_rows = total_data_rows
            prev_deletion_rows = total_deletion_rows
            prev_columns = current_columns

        logger.info(f"Found {len(versions_info)} versions for table {self.table_name}")
        return versions_info
