"""CLI script to ingest images, compute embeddings, and save to Lance."""

import glob
import os
from pathlib import Path
from typing import Optional

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


def compute_clip_embedding(
    image: Image.Image,
    model: CLIPVisionModel,
    processor: CLIPImageProcessor,
    device: str,
) -> list[float]:
    """Compute CLIP embedding for an image."""
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use pooled output (CLS token)
        embedding: list[float] = outputs.pooler_output[0].cpu().numpy().tolist()
    return embedding


def compute_dinov2_embedding(
    image: Image.Image,
    model: AutoModel,
    processor: AutoImageProcessor,
    device: str,
) -> list[float]:
    """Compute DINOv2 embedding for an image."""
    inputs = processor(images=image, return_tensors="pt").to(device)  # type: ignore[operator]
    with torch.no_grad():
        outputs = model(**inputs)  # type: ignore[operator]
        # Use CLS token from last hidden state
        embedding: list[float] = outputs.last_hidden_state[:, 0, :][0].cpu().numpy().tolist()
    return embedding


def process_images(
    pattern: str,
    output_path: str,
    use_clip: bool = True,
    use_dinov2: bool = True,
    device: Optional[str] = None,
) -> None:
    """
    Process images matching a glob pattern, compute embeddings, and save to Lance.

    Args:
        pattern: Glob pattern to match image files (e.g., "images/*.jpg")
        output_path: Path to output Lance database directory
        use_clip: Whether to compute CLIP embeddings
        use_dinov2: Whether to compute DINOv2 embeddings
        device: Device to use for inference (cuda, mps, or cpu)
    """
    import lancedb

    # Find all matching files
    image_paths = sorted(glob.glob(pattern, recursive=True))

    if not image_paths:
        logger.warning(f"No images found matching pattern: {pattern}")
        return

    logger.info(f"Found {len(image_paths)} images matching pattern: {pattern}")

    # Determine device
    if device is None:
        if torch.cuda.is_available():
            device = "cuda"
        elif torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"

    logger.info(f"Using device: {device}")

    # Load models
    clip_model, clip_processor = None, None
    dinov2_model, dinov2_processor = None, None

    if use_clip:
        logger.info("Loading CLIP model...")
        clip_model, clip_processor = load_clip_model(device)

    if use_dinov2:
        logger.info("Loading DINOv2 model...")
        dinov2_model, dinov2_processor = load_dinov2_model(device)

    # Process images
    records: list[dict] = []

    for image_path in tqdm(image_paths, desc="Processing images"):
        try:
            # Load image
            image = Image.open(image_path).convert("RGB")

            # Read image bytes
            with open(image_path, "rb") as f:
                image_bytes = f.read()

            # Get relative path from pattern base
            rel_path = os.path.basename(image_path)

            # Get image dimensions
            width, height = image.size

            # Use absolute path for image.path
            abs_path = os.path.abspath(image_path)

            record: dict = {
                "filename": rel_path,
                "image": {"bytes": image_bytes, "path": abs_path},
                "bytes_size": len(image_bytes),
                "width": width,
                "height": height,
            }

            # Compute CLIP embedding
            if use_clip and clip_model is not None and clip_processor is not None:
                clip_embedding = compute_clip_embedding(image, clip_model, clip_processor, device)
                record["clip_embedding"] = clip_embedding

            # Compute DINOv2 embedding
            if use_dinov2 and dinov2_model is not None and dinov2_processor is not None:
                dinov2_embedding = compute_dinov2_embedding(
                    image, dinov2_model, dinov2_processor, device
                )
                record["dinov2_embedding"] = dinov2_embedding

            records.append(record)

        except Exception as e:
            logger.error(f"Error processing {image_path}: {e}")
            continue

    if not records:
        logger.warning("No images were successfully processed")
        return

    # Convert to PyArrow table
    logger.info(f"Saving {len(records)} records to {output_path}")

    # Build schema with fixed-size list for embeddings (required for Lance vector index)
    fields = [
        pa.field("filename", pa.string()),
        pa.field(
            "image",
            pa.struct([("bytes", pa.binary()), ("path", pa.string())]),
        ),
        pa.field("bytes_size", pa.int64()),
        pa.field("width", pa.int32()),
        pa.field("height", pa.int32()),
    ]

    embedding_columns: list[str] = []

    # Detect embedding dimensions from first record
    clip_dim = len(records[0]["clip_embedding"]) if use_clip else 0
    dinov2_dim = len(records[0]["dinov2_embedding"]) if use_dinov2 else 0

    if use_clip:
        fields.append(pa.field("clip_embedding", pa.list_(pa.float32(), clip_dim)))
        embedding_columns.append("clip_embedding")

    if use_dinov2:
        fields.append(pa.field("dinov2_embedding", pa.list_(pa.float32(), dinov2_dim)))
        embedding_columns.append("dinov2_embedding")

    schema = pa.schema(fields)

    # Build arrays
    arrays = [
        pa.array([r["filename"] for r in records]),
        pa.array(
            [r["image"] for r in records],
            type=pa.struct([("bytes", pa.binary()), ("path", pa.string())]),
        ),
        pa.array([r["bytes_size"] for r in records], type=pa.int64()),
        pa.array([r["width"] for r in records], type=pa.int32()),
        pa.array([r["height"] for r in records], type=pa.int32()),
    ]

    if use_clip:
        arrays.append(
            pa.array(
                [r["clip_embedding"] for r in records],
                type=pa.list_(pa.float32(), clip_dim),
            )
        )

    if use_dinov2:
        arrays.append(
            pa.array(
                [r["dinov2_embedding"] for r in records],
                type=pa.list_(pa.float32(), dinov2_dim),
            )
        )

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

    # Create vector indices for embedding columns
    for col in embedding_columns:
        logger.info(f"Creating IVF-PQ index on '{col}'...")
        lance_table.create_index(
            metric="cosine",
            vector_column_name=col,
        )
        logger.info(f"Successfully created index on '{col}'")

    logger.info(f"Successfully saved to {output_path}")


@click.command()
@click.argument("pattern", type=str)
@click.option(
    "-o",
    "--output",
    type=str,
    default="images.lance",
    help="Output Lance table path (e.g., ./mydb/images.lance)",
)
@click.option(
    "--clip/--no-clip",
    default=True,
    help="Compute CLIP embeddings",
)
@click.option(
    "--dinov2/--no-dinov2",
    default=True,
    help="Compute DINOv2 embeddings",
)
@click.option(
    "--device",
    type=click.Choice(["cuda", "mps", "cpu"]),
    default=None,
    help="Device to use for inference (default: auto-detect)",
)
def main(
    pattern: str,
    output: str,
    clip: bool,
    dinov2: bool,
    device: Optional[str],
) -> None:
    """
    Ingest images, compute embeddings, and save to Lance.

    PATTERN: Glob pattern to match image files (e.g., "images/**/*.jpg")

    Examples:

        python -m smoosense.images.ingest "photos/*.jpg" -o ./mydb/photos.lance

        python -m smoosense.images.ingest "data/**/*.png" --no-dinov2 -o ./mydb/clip_only.lance
    """
    process_images(
        pattern=pattern,
        output_path=output,
        use_clip=clip,
        use_dinov2=dinov2,
        device=device,
    )


if __name__ == "__main__":
    main()
