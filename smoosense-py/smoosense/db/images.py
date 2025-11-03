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
from typing import Any, Dict, List, Optional

import lancedb
import numpy as np
import torch
import umap
from PIL import Image
from open_clip import create_model_and_transforms
from tqdm import tqdm

logger = logging.getLogger(__name__)


class ImageEmbeddingGenerator:
    """Generate embeddings for images using CLIP."""

    def __init__(
        self,
        model_name: str = "ViT-B-32",
        pretrained: str = "openai",
        device: Optional[str] = None
    ):
        """
        Initialize the embedding generator.

        Args:
            model_name: CLIP model architecture (e.g., "ViT-B-32", "ViT-L-14")
            pretrained: Pretrained weights source (e.g., "openai", "laion2b_s34b_b79k")
            device: Device to use ("cuda", "mps", "cpu", or None for auto-detect)
        """
        if device is None:
            # Check device availability in order: cuda > mps > cpu
            if torch.cuda.is_available():
                self.device = "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device

        logger.info(f"Loading CLIP model {model_name} ({pretrained}) on {self.device}")
        self.model, _, self.preprocess = create_model_and_transforms(
            model_name,
            pretrained=pretrained,
            device=self.device
        )
        self.model.eval()

        logger.info(f"CLIP model loaded on {self.device}")

    def generate_embedding(self, image_path: str) -> np.ndarray:
        """
        Generate embedding for a single image.

        Args:
            image_path: Path to the image file

        Returns:
            Numpy array of embeddings (shape: [embedding_dim])

        Raises:
            Exception: If image cannot be loaded or processed
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert("RGB")
            image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)

            # Generate embedding
            with torch.no_grad():
                embedding = self.model.encode_image(image_tensor)
                # Normalize embedding
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)

            return embedding.cpu().numpy().squeeze()

        except Exception as e:
            logger.error(f"Failed to generate embedding for {image_path}: {e}")
            raise


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
    db_path: str = ".",
    model_name: str = "ViT-B-32",
    pretrained: str = "openai",
    batch_size: int = 32
) -> int:
    """
    Add images to a Lance table with metadata and embeddings.

    Args:
        image_paths: List of paths to image files
        db_path: Directory where the Lance database is stored
        model_name: CLIP model architecture
        pretrained: Pretrained weights source
        batch_size: Number of images to process before writing to table

    Returns:
        Number of images successfully added

    Raises:
        Exception: If table creation or data insertion fails
    """
    table_name = "images"
    logger.info(f"Adding {len(image_paths)} images to Lance table '{table_name}'")

    # Initialize embedding generator
    embedding_generator = ImageEmbeddingGenerator(
        model_name=model_name,
        pretrained=pretrained
    )

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
            embedding = embedding_generator.generate_embedding(image_path)
            metadata["embedding"] = embedding
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

    # Write all records in batches
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i + batch_size]
        _write_batch_to_table(db, table_name, batch, table_exists)
        table_exists = True  # Table now exists after first batch

    logger.info(
        f"Completed: {success_count} images added, {failed_count} failed"
    )

    return success_count


def _write_batch_to_table(
    db: lancedb.DBConnection,
    table_name: str,
    records: List[Dict[str, Any]],
    table_exists: bool
) -> None:
    """
    Write a batch of records to the Lance table.

    Args:
        db: LanceDB connection
        table_name: Name of the table
        records: List of record dictionaries
        table_exists: Whether the table already exists
    """
    if not records:
        return

    if table_exists:
        # Append to existing table
        table = db.open_table(table_name)
        table.add(records)
        logger.debug(f"Added {len(records)} records to existing table '{table_name}'")
    else:
        # Create new table
        db.create_table(table_name, records)
        logger.info(f"Created new table '{table_name}' with {len(records)} records")
