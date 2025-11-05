"""
Embedding generation utilities for SmooSense.

This module provides functionality to:
- Generate embeddings using CLIP models
- Manage embedding model configurations
"""

import logging
import re
from typing import Optional

import numpy as np
import torch
from open_clip import create_model_and_transforms
from PIL import Image

logger = logging.getLogger(__name__)

# CLIP model configuration
MODEL_NAME = "ViT-B-32"
PRETRAINED = "openai"


def _sanitize_name(name: str) -> str:
    """
    Sanitize a name by replacing all non-alphanumeric characters with underscores.
    Converts to lowercase for case-insensitive consistency with LanceDB.

    Args:
        name: Name to sanitize

    Returns:
        Sanitized name with only lowercase alphanumeric characters and underscores
    """
    return re.sub(r'[^a-zA-Z0-9]', '_', name).lower()


class EmbeddingGenerator:
    """Generate embeddings for images and text using CLIP."""

    def __init__(self, device: Optional[str] = None):
        """
        Initialize the embedding generator.

        Args:
            device: Device to use ("cuda", "mps", "cpu", or None for auto-detect)
        """
        self.model_name = MODEL_NAME
        self.pretrained = PRETRAINED

        # Generate embedding column name
        sanitized_pretrained = _sanitize_name(PRETRAINED)
        sanitized_model_name = _sanitize_name(MODEL_NAME)
        self.embedding_column_name = f"emb_clip_{sanitized_pretrained}_{sanitized_model_name}"

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

        logger.info(f"Loading CLIP model {MODEL_NAME} ({PRETRAINED}) on {self.device}")
        logger.info(f"Embedding column name: {self.embedding_column_name}")
        self.model, _, self.preprocess = create_model_and_transforms(
            MODEL_NAME,
            pretrained=PRETRAINED,
            device=self.device,
        )
        self.model.eval()

        # Get tokenizer for text embeddings
        import open_clip
        self.tokenizer = open_clip.get_tokenizer(MODEL_NAME)

        logger.info(f"CLIP model loaded on {self.device}")

    def generate_embedding_for_image(self, image_path: str) -> np.ndarray:
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

    def generate_embedding_for_text(self, text: str) -> np.ndarray:
        """
        Generate embedding for text.

        Args:
            text: Text to generate embedding for

        Returns:
            Numpy array of embeddings (shape: [embedding_dim])

        Raises:
            Exception: If text embedding generation fails
        """
        try:
            # Tokenize text
            text_tokens = self.tokenizer([text]).to(self.device)

            # Generate embedding
            with torch.no_grad():
                embedding = self.model.encode_text(text_tokens)
                # Normalize embedding
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)

            return embedding.cpu().numpy().squeeze()

        except Exception as e:
            logger.error(f"Failed to generate embedding for text '{text}': {e}")
            raise
