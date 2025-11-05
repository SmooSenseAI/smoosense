"""
Image processing and Lance table management for images.

This module provides functionality to:
- Extract image metadata (dimensions, format, size, etc.)
- Generate embeddings using CLIP
- Add images to Lance tables
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List

import lancedb
import numpy as np
import pandas as pd
import pyarrow as pa
import umap
from PIL import Image
from tqdm import tqdm

from smoosense.db.emb import EmbeddingGenerator

logger = logging.getLogger(__name__)


def extract_image_metadata(image_path: str) -> Dict[str, Any]:
    """
    Extract metadata from an image file.

    Args:
        image_path: Path to the image file

    Returns:
        Dictionary containing image metadata

    Raises:
        Exception: If image cannot be opened or metadata extracted
    """
    try:
        # Get file stats
        file_stat = os.stat(image_path)
        file_size = file_stat.st_size
        modified_time = datetime.fromtimestamp(file_stat.st_mtime)

        # Open image and extract metadata
        with Image.open(image_path) as img:
            width, height = img.size
            format_name = img.format
            mode = img.mode

        return {
            "path": os.path.abspath(image_path),
            "filename": os.path.basename(image_path),
            "width": width,
            "height": height,
            "format": format_name,
            "mode": mode,
            "file_size": file_size,
            "modified_time": modified_time.isoformat(),
            "aspect_ratio": width / height if height > 0 else 0.0,
        }

    except Exception as e:
        logger.error(f"Failed to extract metadata from {image_path}: {e}")
        raise


def add_images_to_lance(
    image_paths: List[str],
    db_path: str = "."
) -> int:
    """
    Add images to a Lance table with metadata and embeddings.

    Args:
        image_paths: List of paths to image files
        db_path: Directory where the Lance database is stored

    Returns:
        Number of images successfully added

    Raises:
        Exception: If table creation or data insertion fails
    """
    table_name = "images"
    logger.info(f"Adding {len(image_paths)} images to Lance table '{table_name}'")

    # Initialize embedding generator
    embedding_generator = EmbeddingGenerator()

    # Get the embedding column name
    embedding_column_name = embedding_generator.embedding_column_name

    # Connect to Lance database
    db = lancedb.connect(db_path)

    # Check if table exists
    table_exists = table_name in db.table_names()

    # Process images - collect all data first if we need to compute UMAP
    all_records: List[Dict[str, Any]] = []
    all_embeddings: List[np.ndarray] = []
    success_count = 0
    failed_count = 0

    for image_path in tqdm(image_paths, desc="Processing images"):
        try:
            # Extract metadata
            metadata = extract_image_metadata(image_path)

            # Generate embedding
            embedding = embedding_generator.generate_embedding_for_image(image_path)
            metadata[embedding_column_name] = embedding
            all_embeddings.append(embedding)

            all_records.append(metadata)
            success_count += 1

        except Exception as e:
            logger.error(f"Failed to process {image_path}: {e}")
            failed_count += 1

    # Compute UMAP coordinates if we have multiple embeddings
    if all_embeddings and len(all_embeddings) > 1:
        logger.info(f"Computing UMAP 2D coordinates for {len(all_embeddings)} embeddings...")

        # Stack embeddings into matrix
        embeddings_matrix = np.vstack(all_embeddings)

        # Fit UMAP
        reducer = umap.UMAP(n_components=2)
        umap_coords = reducer.fit_transform(embeddings_matrix)

        # Add UMAP coordinates to records
        for i, record in enumerate(all_records):
            record["emb_x"] = float(umap_coords[i, 0])
            record["emb_y"] = float(umap_coords[i, 1])

        logger.info("UMAP coordinates computed successfully")

    # Write all records in one batch
    _write_batch_to_table(db, table_name, all_records, table_exists, embedding_column_name)

    # Create index for embedding column to support vector search
    if all_records:
        logger.info(f"Creating vector index for embedding column '{embedding_column_name}'...")
        try:
            table = db.open_table(table_name)
            table.create_index(
                metric="cosine",
                vector_column_name=embedding_column_name
            )
            logger.info(f"Vector index created successfully for column '{embedding_column_name}'")
        except Exception as e:
            logger.warning(f"Failed to create vector index: {e}")
            # Don't fail the entire operation if index creation fails

    logger.info(
        f"Completed: {success_count} images added, {failed_count} failed"
    )

    return success_count


def _write_batch_to_table(
    db: lancedb.DBConnection,
    table_name: str,
    records: List[Dict[str, Any]],
    table_exists: bool,
    embedding_column_name: str
) -> None:
    """
    Write a batch of records to the Lance table with proper vector schema.

    Args:
        db: LanceDB connection
        table_name: Name of the table
        records: List of record dictionaries
        table_exists: Whether the table already exists
        embedding_column_name: Name of the embedding column
    """
    if not records:
        return

    # Get embedding dimension from first record
    first_embedding = records[0].get(embedding_column_name)
    if first_embedding is not None and isinstance(first_embedding, np.ndarray):
        embedding_dim = len(first_embedding)

        # Convert records to pandas DataFrame
        df = pd.DataFrame(records)

        # Convert embedding column to proper format for LanceDB
        # LanceDB expects vectors as lists, not numpy arrays
        if embedding_column_name in df.columns:
            df[embedding_column_name] = df[embedding_column_name].apply(
                lambda x: x.tolist() if isinstance(x, np.ndarray) else x
            )

        # Convert DataFrame to PyArrow Table with explicit FixedSizeList schema for embeddings
        pa_table = pa.Table.from_pandas(df)

        # Find the embedding column and convert it to FixedSizeList
        embedding_idx = pa_table.schema.get_field_index(embedding_column_name)
        if embedding_idx >= 0:
            # Create new schema with FixedSizeList for embedding column
            fields = []
            for i, field in enumerate(pa_table.schema):
                if i == embedding_idx:
                    # Replace with FixedSizeList
                    fields.append(pa.field(embedding_column_name, pa.list_(pa.float32(), embedding_dim)))
                else:
                    fields.append(field)

            new_schema = pa.schema(fields)

            # Convert embedding column data to FixedSizeList
            embedding_data = pa_table.column(embedding_column_name).to_pylist()
            # Convert to float32 and create FixedSizeList array
            embedding_array = pa.array(
                [[float(val) for val in row] for row in embedding_data],
                type=pa.list_(pa.float32(), embedding_dim)
            )

            # Rebuild table with new schema
            columns = []
            for i in range(len(pa_table.schema)):
                if i == embedding_idx:
                    columns.append(embedding_array)
                else:
                    columns.append(pa_table.column(i))

            pa_table = pa.Table.from_arrays(columns, schema=new_schema)

        if table_exists:
            # Append to existing table
            table = db.open_table(table_name)
            table.add(pa_table)
            logger.debug(f"Added {len(records)} records to existing table '{table_name}'")
        else:
            # Create new table with PyArrow table (has proper FixedSizeList schema)
            db.create_table(table_name, pa_table, mode="overwrite")
            logger.info(f"Created new table '{table_name}' with {len(records)} records")
    else:
        # Fallback for records without embeddings
        df = pd.DataFrame(records)
        if table_exists:
            table = db.open_table(table_name)
            table.add(df)
            logger.debug(f"Added {len(records)} records to existing table '{table_name}'")
        else:
            db.create_table(table_name, df, mode="overwrite")
            logger.info(f"Created new table '{table_name}' with {len(records)} records")
