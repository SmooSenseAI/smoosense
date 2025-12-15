"""CLI script to ingest images, compute embeddings, and save to Lance."""

import os
from pathlib import Path

import click
import pyarrow as pa
import torch
from PIL import Image
from tqdm import tqdm
from transformers import (
    AutoImageProcessor,
    AutoModel,
    CLIPImageProcessor,
    CLIPVisionModel,
)

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


def _get_device() -> str:
    """Auto-detect the best available device."""
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def load_clip_model(device: str) -> tuple[CLIPVisionModel, CLIPImageProcessor]:
    """Load CLIP vision model and processor."""
    model_name = "openai/clip-vit-base-patch32"
    processor = CLIPImageProcessor.from_pretrained(model_name)
    model = CLIPVisionModel.from_pretrained(model_name).to(device)
    model.eval()
    return model, processor


def load_dinov2_model(device: str) -> tuple[AutoModel, AutoImageProcessor]:
    """Load DINOv2 model and processor."""
    model_name = "facebook/dinov2-base"
    processor = AutoImageProcessor.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name).to(device)
    model.eval()
    return model, processor


def compute_clip_embeddings_batch(
    images: list[Image.Image],
    model: CLIPVisionModel,
    processor: CLIPImageProcessor,
    device: str,
) -> list[list[float]]:
    """Compute CLIP embeddings for a batch of images (L2-normalized)."""
    inputs = processor(images=images, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use pooled output (CLS token)
        embs = outputs.pooler_output
        # L2 normalize
        embs = embs / embs.norm(dim=1, keepdim=True)
        embeddings: list[list[float]] = embs.cpu().numpy().tolist()
    return embeddings


def compute_dinov2_embeddings_batch(
    images: list[Image.Image],
    model: AutoModel,
    processor: AutoImageProcessor,
    device: str,
) -> list[list[float]]:
    """Compute DINOv2 embeddings for a batch of images (L2-normalized)."""
    inputs = processor(images=images, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use CLS token from last hidden state
        embs = outputs.last_hidden_state[:, 0, :]
        # L2 normalize
        embs = embs / embs.norm(dim=1, keepdim=True)
        embeddings: list[list[float]] = embs.cpu().numpy().tolist()
    return embeddings


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
        batch_size: Number of images to process in each batch
    """
    import lancedb

    if not files:
        logger.warning("No image files provided")
        return

    logger.info(f"Processing {len(files)} images with batch_size={batch_size}")

    # Determine device
    device = _get_device()
    logger.info(f"Using device: {device}")

    # Load models (always use both CLIP and DINOv2)
    logger.info("Loading CLIP model...")
    clip_model, clip_processor = load_clip_model(device)

    logger.info("Loading DINOv2 model...")
    dinov2_model, dinov2_processor = load_dinov2_model(device)

    # Process images
    records: list[dict] = []

    # Get absolute output path for computing relative paths
    abs_output_path = os.path.abspath(output_path)
    output_dir = os.path.dirname(abs_output_path)

    # Process in batches
    for batch_start in tqdm(range(0, len(files), batch_size), desc="Processing batches"):
        batch_files = files[batch_start : batch_start + batch_size]

        # Load images and collect metadata
        batch_images: list[Image.Image] = []
        batch_metadata: list[dict] = []

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
                    "clip_embedding": clip_embeddings[i],
                    "dinov2_embedding": dinov2_embeddings[i],
                }
                records.append(record)

        except Exception as e:
            logger.error(f"Error computing embeddings for batch: {e}")
            continue

    if not records:
        logger.warning("No images were successfully processed")
        return

    # Convert to PyArrow table
    logger.info(f"Saving {len(records)} records to {output_path}")

    # Detect embedding dimensions from first record
    clip_dim = len(records[0]["clip_embedding"])
    dinov2_dim = len(records[0]["dinov2_embedding"])

    # Build schema with fixed-size list for embeddings (required for Lance vector index)
    fields = [
        pa.field("image_path", pa.string()),
        pa.field("bytes_size", pa.int64()),
        pa.field("width", pa.int32()),
        pa.field("height", pa.int32()),
        pa.field("clip_embedding", pa.list_(pa.float32(), clip_dim)),
        pa.field("dinov2_embedding", pa.list_(pa.float32(), dinov2_dim)),
    ]

    schema = pa.schema(fields)

    # Build arrays
    arrays = [
        pa.array([r["image_path"] for r in records]),
        pa.array([r["bytes_size"] for r in records], type=pa.int64()),
        pa.array([r["width"] for r in records], type=pa.int32()),
        pa.array([r["height"] for r in records], type=pa.int32()),
        pa.array(
            [r["clip_embedding"] for r in records],
            type=pa.list_(pa.float32(), clip_dim),
        ),
        pa.array(
            [r["dinov2_embedding"] for r in records],
            type=pa.list_(pa.float32(), dinov2_dim),
        ),
    ]

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
        # If no .lance extension, use output_path as db path and "images" as table name
        db_path = output_path
        table_name = "images"

    # Ensure database directory exists
    if db_path:
        Path(db_path).mkdir(parents=True, exist_ok=True)

    # Connect to LanceDB and create/overwrite table
    db = lancedb.connect(db_path)
    lance_table = db.create_table(table_name, table, mode="overwrite")

    logger.info(f"Created Lance table '{table_name}' at {db_path}")

    # Create vector indices for embedding columns (only if enough rows for IVF-PQ)
    if len(records) >= 256:
        embedding_columns = ["clip_embedding", "dinov2_embedding"]
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
    default=os.path.join(os.getcwd(), "images.lance"),
    help="Output Lance table path (e.g., ./mydb/images.lance)",
)
@click.option(
    "-b",
    "--batch-size",
    type=int,
    default=32,
    help="Number of images to process in each batch (default: 32)",
)
def main(
    files: tuple[str, ...],
    output_path: str,
    batch_size: int,
) -> None:
    """
    Ingest images, compute embeddings (CLIP and DINOv2), and save to Lance.

    FILES: One or more image files to process.

    Examples:

        python -m smoosense.images.ingest photo1.jpg photo2.jpg -o ./mydb/photos.lance

        python -m smoosense.images.ingest *.jpg *.png --output-path ./mydb/images.lance
    """
    process_images(
        files=files,
        output_path=output_path,
        batch_size=batch_size,
    )


if __name__ == "__main__":
    main()
