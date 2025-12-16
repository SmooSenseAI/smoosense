"""CLI script to ingest videos, extract first frame embeddings, and save to Lance."""

import os
from pathlib import Path
from typing import Optional

import click
import cv2
import pyarrow as pa
from PIL import Image
from tqdm import tqdm

from smoosense.emb.models import (
    CLIP_COLUMN_NAME,
    CLIPModel,
    CLIPProcessor,
    compute_clip_embeddings_batch,
    get_device,
    load_clip_model,
)
from smoosense.emb.path_grouping import compute_path_groups
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


def get_video_info_and_first_frame(
    video_path: str,
) -> Optional[tuple[dict, Image.Image]]:
    """
    Extract video metadata and first frame using OpenCV.

    Returns tuple of (info dict, PIL Image) or None if failed.
    """
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open video: {video_path}")
            return None

        # Get metadata
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0.0

        # Get first frame
        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            logger.error(f"Could not read first frame from: {video_path}")
            return None

        # Convert BGR to RGB and create PIL Image
        image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        info = {
            "width": width,
            "height": height,
            "duration": duration,
        }

        return info, image

    except Exception as e:
        logger.error(f"Error processing video {video_path}: {e}")
        return None


def process_video_batch(
    batch_files: tuple[str, ...],
    output_dir: str,
    clip_model: CLIPModel,
    clip_processor: CLIPProcessor,
    device: str,
) -> tuple[list[dict], list[str]]:
    """
    Process a batch of video files and compute embeddings.

    Args:
        batch_files: Video file paths in this batch
        output_dir: Directory for computing relative paths
        clip_model: Loaded CLIP model
        clip_processor: CLIP processor
        device: Device for computation

    Returns:
        Tuple of (records list, processed file paths list)
    """
    batch_images: list[Image.Image] = []
    batch_metadata: list[dict] = []
    batch_original_paths: list[str] = []

    for video_path in batch_files:
        try:
            abs_video_path = os.path.abspath(video_path)
            result = get_video_info_and_first_frame(abs_video_path)
            if result is None:
                logger.warning(f"Skipping {video_path}: could not process video")
                continue

            video_info, first_frame = result
            video_rel_path = "./" + os.path.relpath(abs_video_path, output_dir)
            filename = os.path.basename(abs_video_path)
            bytes_size = os.path.getsize(abs_video_path)

            batch_images.append(first_frame)
            batch_original_paths.append(abs_video_path)
            batch_metadata.append(
                {
                    "video_path": video_rel_path,
                    "filename": filename,
                    "bytes_size": bytes_size,
                    "width": video_info["width"],
                    "height": video_info["height"],
                    "duration": video_info["duration"],
                }
            )
        except Exception as e:
            logger.error(f"Error processing {video_path}: {e}")
            continue

    if not batch_images:
        return [], []

    try:
        clip_embeddings = compute_clip_embeddings_batch(
            batch_images, clip_model, clip_processor, device
        )
        records = []
        processed_paths = []
        for i, metadata in enumerate(batch_metadata):
            records.append({**metadata, CLIP_COLUMN_NAME: clip_embeddings[i]})
            processed_paths.append(batch_original_paths[i])
        return records, processed_paths
    except Exception as e:
        logger.error(f"Error computing embeddings for batch: {e}")
        return [], []


def build_pyarrow_table(
    records: list[dict],
    groups: Optional[list[str]],
) -> pa.Table:
    """
    Build a PyArrow table from video records.

    Args:
        records: List of video record dicts with embeddings
        groups: Optional list of group labels (same length as records)

    Returns:
        PyArrow Table with proper schema for Lance
    """
    clip_dim = len(records[0][CLIP_COLUMN_NAME])
    has_groups = groups is not None

    fields = [
        pa.field("video_path", pa.string()),
        pa.field("filename", pa.string()),
        pa.field("bytes_size", pa.int64()),
        pa.field("width", pa.int32()),
        pa.field("height", pa.int32()),
        pa.field("duration", pa.float64()),
        pa.field(CLIP_COLUMN_NAME, pa.list_(pa.float32(), clip_dim)),
    ]

    if has_groups:
        fields.insert(2, pa.field("folder_group", pa.string()))

    schema = pa.schema(fields)

    arrays = [
        pa.array([r["video_path"] for r in records]),
        pa.array([r["filename"] for r in records]),
        pa.array([r["bytes_size"] for r in records], type=pa.int64()),
        pa.array([r["width"] for r in records], type=pa.int32()),
        pa.array([r["height"] for r in records], type=pa.int32()),
        pa.array([r["duration"] for r in records], type=pa.float64()),
        pa.array(
            [r[CLIP_COLUMN_NAME] for r in records],
            type=pa.list_(pa.float32(), clip_dim),
        ),
    ]

    if has_groups:
        arrays.insert(2, pa.array(groups))

    return pa.Table.from_arrays(arrays, schema=schema)


def save_to_lance(
    table: pa.Table,
    output_path: str,
    num_records: int,
) -> None:
    """
    Save PyArrow table to LanceDB with optional vector index.

    Args:
        table: PyArrow table to save
        output_path: Output path (e.g., ./mydb/videos.lance)
        num_records: Number of records (for index creation decision)
    """
    import lancedb

    if output_path.endswith(".lance"):
        db_path = os.path.dirname(output_path)
        table_name = os.path.basename(output_path).replace(".lance", "")
    else:
        db_path = output_path
        table_name = "videos"

    if db_path:
        Path(db_path).mkdir(parents=True, exist_ok=True)

    db = lancedb.connect(db_path)
    lance_table = db.create_table(table_name, table, mode="overwrite")
    logger.info(f"Created Lance table '{table_name}' at {db_path}")

    if num_records >= 256:
        logger.info(f"Creating IVF-PQ index on '{CLIP_COLUMN_NAME}'...")
        lance_table.create_index(
            metric="cosine",
            vector_column_name=CLIP_COLUMN_NAME,
        )
        logger.info(f"Successfully created index on '{CLIP_COLUMN_NAME}'")
    else:
        logger.info(
            f"Skipping index creation - only {num_records} rows (need 256+ for IVF-PQ). "
            "Brute-force search will be used."
        )

    logger.info(f"Successfully saved to {output_path}")


def process_videos(
    files: tuple[str, ...],
    output_path: str,
    batch_size: int = 32,
) -> None:
    """
    Process video files, extract first frame embeddings, and save to Lance.

    Args:
        files: Tuple of video file paths
        output_path: Path to output Lance database directory
        batch_size: Number of videos to process in each batch
    """
    if not files:
        logger.warning("No video files provided")
        return

    logger.info(f"Processing {len(files)} videos with batch_size={batch_size}")

    device = get_device()
    logger.info(f"Using device: {device}")

    logger.info("Loading CLIP model...")
    clip_model, clip_processor = load_clip_model(device)

    records: list[dict] = []
    processed_file_paths: list[str] = []
    abs_output_path = os.path.abspath(output_path)
    output_dir = os.path.dirname(abs_output_path)

    for batch_start in tqdm(range(0, len(files), batch_size), desc="Processing batches"):
        batch_files = files[batch_start : batch_start + batch_size]
        batch_records, batch_paths = process_video_batch(
            tuple(batch_files), output_dir, clip_model, clip_processor, device
        )
        records.extend(batch_records)
        processed_file_paths.extend(batch_paths)

    if not records:
        logger.warning("No videos were successfully processed")
        return

    groups = compute_path_groups(processed_file_paths)
    logger.info(f"Saving {len(records)} records to {output_path}")

    table = build_pyarrow_table(records, groups)
    save_to_lance(table, output_path, len(records))


@click.command()
@click.argument("files", nargs=-1, required=True, type=click.Path(exists=True))
@click.option(
    "-o",
    "--output-path",
    type=str,
    default=os.path.join(os.getcwd(), "videos_table.lance"),
    help="Output Lance table path (e.g., ./mydb/videos_table.lance)",
)
def main(
    files: tuple[str, ...],
    output_path: str,
) -> None:
    """
    Ingest videos, extract first frame CLIP embeddings, and save to Lance.

    FILES: One or more video files to process.

    Examples:

        sense-videos video1.mp4 video2.mp4 -o ./mydb/videos.lance

        sense-videos *.mp4 *.mov --output-path ./mydb/videos.lance
    """
    process_videos(
        files=files,
        output_path=output_path,
    )


if __name__ == "__main__":
    main()
