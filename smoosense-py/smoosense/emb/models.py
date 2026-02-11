"""Model loading and embedding computation utilities."""

from typing import Any

import torch
from PIL import Image
from transformers import (
    AutoImageProcessor,
    AutoModel,
    CLIPModel,
    CLIPProcessor,
)

# Model names
CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"
DINOV2_MODEL_NAME = "facebook/dinov2-base"


def model_name_to_column_name(model_name: str) -> str:
    """Convert model name to embedding column name.

    Example: "openai/clip-vit-base-patch32" -> "emb_openai_clip_vit_base_patch32"
    """
    return "emb_" + model_name.replace("/", "_").replace("-", "_")


# Column names derived from model names
CLIP_COLUMN_NAME = model_name_to_column_name(CLIP_MODEL_NAME)
DINOV2_COLUMN_NAME = model_name_to_column_name(DINOV2_MODEL_NAME)


def get_device() -> str:
    """Auto-detect the best available device."""
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def load_clip_model(device: str) -> tuple[CLIPModel, CLIPProcessor]:
    """Load full CLIP model (vision + text) and processor.

    Returns the full CLIPModel which can compute both image and text embeddings
    in the same 512-dim projected space, enabling text-to-image search.
    """
    processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME)
    model = CLIPModel.from_pretrained(CLIP_MODEL_NAME).to(device)
    model.eval()
    return model, processor


def compute_clip_text_embedding(
    text: str,
    model: CLIPModel,
    processor: CLIPProcessor,
    device: str,
) -> list[float]:
    """Compute CLIP text embedding (L2-normalized, 512-dim).

    Returns embeddings in the same space as compute_clip_embeddings_batch,
    enabling text-to-image similarity search.
    """
    inputs = processor(text=[text], return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        # L2 normalize
        text_features = text_features / text_features.norm(dim=1, keepdim=True)
        embedding: list[float] = text_features.cpu().numpy().tolist()[0]
    return embedding


def load_dinov2_model(device: str) -> tuple[AutoModel, AutoImageProcessor]:
    """Load DINOv2 model and processor."""
    processor = AutoImageProcessor.from_pretrained(DINOV2_MODEL_NAME)
    model = AutoModel.from_pretrained(DINOV2_MODEL_NAME).to(device)
    model.eval()
    return model, processor


def compute_clip_embeddings_batch(
    images: list[Image.Image],
    model: CLIPModel,
    processor: CLIPProcessor,
    device: str,
) -> list[list[float]]:
    """Compute CLIP embeddings for a batch of images (L2-normalized, 512-dim).

    Returns embeddings in the same projected space as text embeddings,
    enabling text-to-image similarity search.
    """
    inputs = processor(images=images, return_tensors="pt").to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
        # L2 normalize
        image_features = image_features / image_features.norm(dim=1, keepdim=True)
        embeddings: list[list[float]] = image_features.cpu().numpy().tolist()
    return embeddings


def compute_dinov2_embeddings_batch(
    images: list[Image.Image],
    model: Any,
    processor: Any,
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
