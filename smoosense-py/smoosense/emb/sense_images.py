"""CLI script to ingest images, compute embeddings, and save to Lance."""

import os
from pathlib import Path
from typing import Optional

import click
import pyarrow as pa
from PIL import Image
from tqdm import tqdm

from smoosense.emb.models import (
    CLIP_COLUMN_NAME,
    DINOV2_COLUMN_NAME,
    compute_clip_embeddings_batch,
    compute_dinov2_embeddings_batch,
    get_device,
    load_clip_model,
    load_dinov2_model,
)
from smoosense.emb.path_grouping import compute_path_groups
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


def process_images(
    files: tuple[str, ...],
    output_path: str,
    batch_size: int = 32,
) -> None:
    """
    Process image files, compute embeddings, and save to Lance.

    Args:
        files: Tuple of image file paths
        output_path: Path to output Lance database directory
        batch_size: Number of emb to process in each batch
    """
    import lancedb

    if not files:
        logger.warning("No image files provided")
        return

    logger.info(f"Processing {len(files)} emb with batch_size={batch_size}")

    # Determine device
    device = get_device()
    logger.info(f"Using device: {device}")

    # Load models (always use both CLIP and DINOv2)
    logger.info("Loading CLIP model...")
    clip_model, clip_processor = load_clip_model(device)

    logger.info("Loading DINOv2 model...")
    dinov2_model, dinov2_processor = load_dinov2_model(device)

    # Process emb
    records: list[dict] = []
    processed_file_paths: list[str] = []  # Track original paths for group computation

    # Get absolute output path for computing relative paths
    abs_output_path = os.path.abspath(output_path)
    output_dir = os.path.dirname(abs_output_path)

    # Process in batches
    for batch_start in tqdm(range(0, len(files), batch_size), desc="Processing batches"):
        batch_files = files[batch_start : batch_start + batch_size]

        # Load emb and collect metadata
        batch_images: list[Image.Image] = []
        batch_metadata: list[dict] = []
        batch_original_paths: list[str] = []

        for image_path in batch_files:
            try:
                # Load image
                image = Image.open(image_path).convert("RGB")

                # Get absolute path of input image
                abs_image_path = os.path.abspath(image_path)

                # Compute relative path with respect to output directory, prefixed with ./
                image_rel_path = "./" + os.path.relpath(abs_image_path, output_dir)

                # Get file size
                bytes_size = os.path.getsize(abs_image_path)

                # Get image dimensions
                width, height = image.size

                batch_images.append(image)
                batch_original_paths.append(abs_image_path)
                batch_metadata.append(
                    {
                        "image_path": image_rel_path,
                        "bytes_size": bytes_size,
                        "width": width,
                        "height": height,
                    }
                )

            except Exception as e:
                logger.error(f"Error loading {image_path}: {e}")
                continue

        if not batch_images:
            continue

        # Compute embeddings for batch
        try:
            clip_embeddings = compute_clip_embeddings_batch(
                batch_images, clip_model, clip_processor, device
            )
            dinov2_embeddings = compute_dinov2_embeddings_batch(
                batch_images, dinov2_model, dinov2_processor, device
            )

            # Combine metadata with embeddings
            for i, metadata in enumerate(batch_metadata):
                record = {
                    **metadata,
                    CLIP_COLUMN_NAME: clip_embeddings[i],
                    DINOV2_COLUMN_NAME: dinov2_embeddings[i],
                }
                records.append(record)
                processed_file_paths.append(batch_original_paths[i])

        except Exception as e:
            logger.error(f"Error computing embeddings for batch: {e}")
            continue

    if not records:
        logger.warning("No emb were successfully processed")
        return

    # Compute groups based on folder structure
    groups: Optional[list[str]] = compute_path_groups(processed_file_paths)
    has_groups = groups is not None

    # Convert to PyArrow table
    logger.info(f"Saving {len(records)} records to {output_path}")

    # Detect embedding dimensions from first record
    clip_dim = len(records[0][CLIP_COLUMN_NAME])
    dinov2_dim = len(records[0][DINOV2_COLUMN_NAME])

    # Build schema with fixed-size list for embeddings (required for Lance vector index)
    fields = [
        pa.field("image_path", pa.string()),
        pa.field("bytes_size", pa.int64()),
        pa.field("width", pa.int32()),
        pa.field("height", pa.int32()),
        pa.field(CLIP_COLUMN_NAME, pa.list_(pa.float32(), clip_dim)),
        pa.field(DINOV2_COLUMN_NAME, pa.list_(pa.float32(), dinov2_dim)),
    ]

    # Add folder_group field only if there are different groups
    if has_groups:
        fields.insert(1, pa.field("folder_group", pa.string()))

    schema = pa.schema(fields)

    # Build arrays
    arrays = [
        pa.array([r["image_path"] for r in records]),
        pa.array([r["bytes_size"] for r in records], type=pa.int64()),
        pa.array([r["width"] for r in records], type=pa.int32()),
        pa.array([r["height"] for r in records], type=pa.int32()),
        pa.array(
            [r[CLIP_COLUMN_NAME] for r in records],
            type=pa.list_(pa.float32(), clip_dim),
        ),
        pa.array(
            [r[DINOV2_COLUMN_NAME] for r in records],
            type=pa.list_(pa.float32(), dinov2_dim),
        ),
    ]

    # Insert folder_group array if needed
    if has_groups:
        arrays.insert(1, pa.array(groups))

    table = pa.Table.from_arrays(arrays, schema=schema)

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir:
        Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Extract database path and table name from output_path
    # output_path format: /path/to/db/table_name.lance
    if output_path.endswith(".lance"):
        db_path = os.path.dirname(output_path)
        table_name = os.path.basename(output_path).replace(".lance", "")
    else:
        # If no .lance extension, use output_path as db path and "emb" as table name
        db_path = output_path
        table_name = "emb"

    # Ensure database directory exists
    if db_path:
        Path(db_path).mkdir(parents=True, exist_ok=True)

    # Connect to LanceDB and create/overwrite table
    db = lancedb.connect(db_path)
    lance_table = db.create_table(table_name, table, mode="overwrite")

    logger.info(f"Created Lance table '{table_name}' at {db_path}")

    # Create vector indices for embedding columns (only if enough rows for IVF-PQ)
    if len(records) >= 256:
        embedding_columns = [CLIP_COLUMN_NAME, DINOV2_COLUMN_NAME]
        for col in embedding_columns:
            logger.info(f"Creating IVF-PQ index on '{col}'...")
            lance_table.create_index(
                metric="cosine",
                vector_column_name=col,
            )
            logger.info(f"Successfully created index on '{col}'")
    else:
        logger.info(
            f"Skipping index creation - only {len(records)} rows (need 256+ for IVF-PQ). "
            "Brute-force search will be used."
        )

    logger.info(f"Successfully saved to {output_path}")


@click.command()
@click.argument("files", nargs=-1, required=True, type=click.Path(exists=True))
@click.option(
    "-o",
    "--output-path",
    type=str,
    default=os.path.join(os.getcwd(), "images_table.lance"),
    help="Output Lance table path (e.g., ./mydb/images_table.lance)",
)
def main(
    files: tuple[str, ...],
    output_path: str,
) -> None:
    """
    Ingest emb, compute embeddings (CLIP and DINOv2), and save to Lance.

    FILES: One or more image files to process.

    Examples:

        python -m smoosense.emb.ingest photo1.jpg photo2.jpg -o ./mydb/photos.lance

        python -m smoosense.emb.ingest *.jpg *.png --output-path ./mydb/emb.lance
    """
    process_images(
        files=files,
        output_path=output_path,
    )


if __name__ == "__main__":
    main()
