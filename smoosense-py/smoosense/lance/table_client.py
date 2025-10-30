import logging
import os

import lancedb
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
        logger.info(f"Connected to Lance table '{table_name}' at {root_folder}")

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
