import logging
import os
from typing import Any, cast

from pydantic import validate_call

from smoosense.lance.models import ColumnInfo, IndexInfo, VersionInfo
from smoosense.utils.serialization import serialize

logger = logging.getLogger(__name__)


class LanceTableClient:
    """Client for interacting with a Lance table."""

    def __init__(self, root_folder: str, table_name: str):
        """
        Initialize the Lance table client.

        Args:
            root_folder: Path to the Lance database directory (local path or S3 URI)
            table_name: Name of the table
        """
        import lancedb  # Import lancedb lazily since it may be slow at the 1st time

        # Check if it's an S3 path
        is_s3_path = root_folder.startswith("s3://")

        if not is_s3_path:
            # Local path handling
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
            table_path: Path to the Lance table (e.g., /path/to/db/table_name.lance
                        or s3://bucket/path/table_name.lance)

        Returns:
            LanceTableClient instance

        Raises:
            ValueError: If the table path is invalid or doesn't end with .lance
        """
        # Check if it's an S3 path
        is_s3_path = table_path.startswith("s3://")

        if not is_s3_path:
            # Local path handling
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
        # Works for both local paths and S3 URIs
        if is_s3_path:
            # For S3: s3://bucket/path/table.lance -> s3://bucket/path and table
            last_slash = table_path.rfind("/")
            root_folder = table_path[:last_slash]
            table_name = table_path[last_slash + 1 :].replace(".lance", "")
        else:
            root_folder = os.path.dirname(table_path)
            table_name = os.path.basename(table_path).replace(".lance", "")

        return LanceTableClient(root_folder, table_name)

    @staticmethod
    def _extract_int_from_metadata(metadata: dict[str, Any], key: str, default: int = 0) -> int:
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
            logger.exception(f"Failed to list indices for table {self.table_name}: {e}")
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
            logger.exception(f"Failed to list columns for table {self.table_name}: {e}")
            # If schema access fails, return empty list
            return []

    @validate_call
    def vector_search(
        self,
        embedding: list[float],
        vector_column: str,
        select_columns: list[str],
        limit: int = 12,
    ) -> list[dict[str, Any]]:
        """
        Perform vector similarity search using Lance's native search.

        Args:
            embedding: Query embedding vector
            vector_column: Name of the column containing embeddings
            select_columns: List of column names to return in results
            limit: Maximum number of results to return

        Returns:
            List of dicts with selected columns and _distance field
        """
        logger.info(
            f"Vector search on '{vector_column}' with {len(select_columns)} columns, limit={limit}"
        )

        try:
            # Build the search query
            query = self.table.search(embedding, vector_column_name=vector_column)

            # Select only requested columns plus distance
            # Lance automatically adds _distance field
            query = query.select(select_columns)
            query = query.limit(limit)

            # Execute and convert to list of dicts
            results: list[dict[str, Any]] = query.to_list()

            logger.info(f"Vector search returned {len(results)} results")
            return cast(list[dict[str, Any]], serialize(results))
        except Exception as e:
            logger.exception(f"Vector search failed: {e}")
            raise
