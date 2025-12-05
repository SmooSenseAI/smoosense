import logging
import os
from typing import Any

import pyarrow.fs as pafs
import pyarrow.parquet as pq
from flask import Blueprint, current_app, jsonify
from werkzeug.wrappers import Response

from smoosense.exceptions import InvalidInputException
from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors, require_arg
from smoosense.utils.s3_fs import S3FileSystem

logger = logging.getLogger(__name__)
parquet_bp = Blueprint("parquet", __name__)


@parquet_bp.get("/parquet/info")
@requires_auth_api
@handle_api_errors
def parquet_info() -> Response:
    """Get metadata information about a Parquet file."""
    file_path = require_arg("filePath")

    try:
        # Check if file_path is S3 URL
        is_s3 = file_path.startswith("s3://")

        if is_s3:
            # Use PyArrow's S3 filesystem
            parquet_file = pq.ParquetFile(file_path[5:], filesystem=pafs.S3FileSystem())
            metadata = parquet_file.metadata

            # Get file size from S3
            file_size = S3FileSystem(current_app.config["S3_CLIENT"]).head_file(file_path).size
        else:
            # Local file - expand user path
            expanded_path = os.path.expanduser(file_path)
            parquet_file = pq.ParquetFile(expanded_path)
            metadata = parquet_file.metadata
            file_size = os.path.getsize(expanded_path)

        # Calculate compression ratio
        total_uncompressed = sum(
            metadata.row_group(i).total_byte_size for i in range(metadata.num_row_groups)
        )
        compression_ratio = total_uncompressed / file_size if file_size > 0 else 0

        # Get compression codec (from first row group, first column)
        compression = "N/A"
        if metadata.num_row_groups > 0:
            row_group = metadata.row_group(0)
            if row_group.num_columns > 0:
                column = row_group.column(0)
                compression = column.compression

        # Get max rows per row group
        row_group_size = (
            max(metadata.row_group(i).num_rows for i in range(metadata.num_row_groups))
            if metadata.num_row_groups > 0
            else 0
        )

        info: dict[str, Any] = {
            "compression": compression,
            "version": metadata.format_version,
            "created_by": metadata.created_by or "Unknown",
            "num_row_groups": metadata.num_row_groups,
            "row_group_size": row_group_size,
            "file_size_bytes": file_size,
            "compression_ratio": round(compression_ratio, 2),
        }

        return jsonify(info)
    except FileNotFoundError as e:
        raise InvalidInputException(f"File not found: {file_path}") from e
