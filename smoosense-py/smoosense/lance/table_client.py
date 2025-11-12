import logging
import os
from functools import lru_cache

import duckdb
import pyarrow as pa
from pydantic import validate_call

from smoosense.lance.models import ColumnInfo, IndexInfo, VersionInfo

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
        import lancedb  # Import lancedb lazily since it may be slow at the 1st time

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

        logger.debug(f"Connected to Lance table '{table_name}' at {root_folder}")

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

    @staticmethod
    def _filter_duckdb_incompatible_columns(arrow_table: pa.Table) -> tuple[pa.Table, list[str]]:
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

    @staticmethod
    @lru_cache(maxsize=3)
    def _load_and_filter_arrow_table(table_path: str) -> tuple[pa.Table, list[str]]:
        """
        Load and filter Arrow table with class-level LRU cache.

        This is cached at the class level with maxsize=3, meaning it persists
        across different LanceTableClient instances for the same table path.

        Args:
            table_path: Full path to the Lance table (e.g., /path/to/db/table_name.lance)

        Returns:
            Tuple of (filtered_arrow_table, incompatible_column_names)

        Raises:
            ValueError: If no compatible columns found
        """

        logger.info(f"Loading Arrow table from {table_path} (cache miss)")

        # Connect and load
        instance = LanceTableClient.from_table_path(table_path)

        arrow_table = instance.table.to_arrow()

        # Filter incompatible columns
        filtered_arrow_table, incompatible_columns = (
            LanceTableClient._filter_duckdb_incompatible_columns(arrow_table)
        )

        if incompatible_columns:
            logger.warning(
                f"Filtered out {len(incompatible_columns)} incompatible column(s): {', '.join(incompatible_columns)}"
            )

        return filtered_arrow_table, incompatible_columns

    def _get_filtered_arrow_table(self) -> pa.Table:
        """
        Get the filtered Arrow table with DuckDB-compatible columns only.

        Uses class-level LRU cache keyed by table path to persist across instances.

        Returns:
            Filtered PyArrow table

        Raises:
            ValueError: If no compatible columns found
        """
        table_path = os.path.join(self.root_folder, f"{self.table_name}.lance")
        filtered_arrow_table, _ = self._load_and_filter_arrow_table(table_path)
        return filtered_arrow_table

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
        logger.debug(f"Executing DuckDB query on Lance table {self.table_name}")

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

        logger.debug(f"Query executed successfully: {len(rows)} rows, {len(column_names)} columns")

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
        prev_indices: set[str] = set()

        for version in version_list:
            timestamp = version["timestamp"]
            # Convert datetime to Unix timestamp (epoch) if needed
            if hasattr(timestamp, "timestamp"):
                timestamp = int(timestamp.timestamp())
            else:
                timestamp = int(timestamp)

            metadata = version.get("metadata", {})

            # Extract fields from metadata using helper function
            total_data_rows = self._extract_int_from_metadata(metadata, "total_data_file_rows")
            total_deletion_rows = self._extract_int_from_metadata(
                metadata, "total_deletion_file_rows"
            )
            total_data_files = self._extract_int_from_metadata(metadata, "total_data_files")

            # Calculate diffs
            rows_add = total_data_rows - prev_data_rows
            rows_remove = total_deletion_rows - prev_deletion_rows

            # Get schema and indices for this version
            try:
                # Use to_lance() to access the dataset at a specific version
                dataset = self.table.to_lance()
                version_dataset = dataset.checkout_version(version["version"])

                # Get columns from schema
                current_columns = set(version_dataset.schema.names)

                # Get indices from the version dataset
                current_indices = set()
                try:
                    indices_list = version_dataset.list_indices()
                    # list_indices returns a list of dicts with 'name' key
                    current_indices = {
                        idx["name"] if isinstance(idx, dict) else idx.name for idx in indices_list
                    }
                except Exception as e:
                    # list_indices may fail for some versions
                    logger.debug(f"Failed to get indices for version {version['version']}: {e}")
                    current_indices = set()
            except Exception as e:
                logger.warning(
                    f"Failed to get schema/indices for version {version['version']}: {e}"
                )
                current_columns = set()
                current_indices = set()

            # Calculate column and index differences
            # Only skip showing additions/removals for the very first version
            is_first_version = version["version"] == version_list[0]["version"]
            columns_add = [] if is_first_version else list(current_columns - prev_columns)
            columns_remove = [] if is_first_version else list(prev_columns - current_columns)
            indices_add = [] if is_first_version else list(current_indices - prev_indices)
            indices_remove = [] if is_first_version else list(prev_indices - current_indices)

            versions_info.append(
                VersionInfo(
                    version=version["version"],
                    timestamp=timestamp,
                    total_data_files=total_data_files,
                    total_rows=total_data_rows,
                    rows_add=rows_add,
                    rows_remove=rows_remove,
                    columns_add=columns_add,
                    columns_remove=columns_remove,
                    indices_add=indices_add,
                    indices_remove=indices_remove,
                )
            )

            # Update previous values for next iteration
            prev_data_rows = total_data_rows
            prev_deletion_rows = total_deletion_rows
            prev_columns = current_columns
            prev_indices = current_indices

        logger.info(f"Found {len(versions_info)} versions for table {self.table_name}")
        return versions_info

    @validate_call
    def list_indices(self) -> list[IndexInfo]:
        """
        List all indices of the table.

        Returns:
            List of IndexInfo models
        """
        logger.info(f"Fetching indices for table {self.table_name}")

        try:
            indices_list = self.table.list_indices()
        except Exception as e:
            logger.error(f"Failed to list indices for table {self.table_name}: {e}")
            # If list_indices fails, return empty list
            return []

        indices_info: list[IndexInfo] = []

        for idx in indices_list:
            try:
                # Get index stats to extract num_unindexed_rows
                stats = self.table.index_stats(idx.name)
                num_unindexed_rows = getattr(stats, "num_unindexed_rows", None)
            except Exception as e:
                logger.warning(f"Failed to get stats for index {idx.name}: {e}")
                num_unindexed_rows = None

            indices_info.append(
                IndexInfo(
                    name=idx.name,
                    index_type=idx.index_type,
                    columns=idx.columns,
                    num_unindexed_rows=num_unindexed_rows,
                )
            )

        logger.info(f"Found {len(indices_info)} indices for table {self.table_name}")
        return indices_info

    @validate_call
    def list_columns(self) -> list[ColumnInfo]:
        """
        List all columns of the table with their types.

        Returns:
            List of ColumnInfo models
        """
        logger.info(f"Fetching columns for table {self.table_name}")

        try:
            # Get schema from the table
            schema = self.table.schema
            columns_info: list[ColumnInfo] = []

            for field in schema:
                columns_info.append(
                    ColumnInfo(
                        name=field.name,
                        type=str(field.type),
                    )
                )

            logger.info(f"Found {len(columns_info)} columns for table {self.table_name}")
            return columns_info
        except Exception as e:
            logger.error(f"Failed to list columns for table {self.table_name}: {e}")
            # If schema access fails, return empty list
            return []
