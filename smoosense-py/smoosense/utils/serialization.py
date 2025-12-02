import base64
import logging
import math
import os
from typing import Any

from .mime_types import get_mime_type

logger = logging.getLogger(__name__)


def _is_huggingface_media(obj: dict) -> bool:
    """Check if a dict is a HuggingFace media struct with bytes and path fields."""
    if len(obj) != 2:
        return False
    return "bytes" in obj and "path" in obj and isinstance(obj["bytes"], bytes)


def _to_data_url(data: bytes, path: str) -> str:
    """Convert bytes to a data URL with proper MIME type."""
    ext = os.path.splitext(path)[1].lower()
    mime_type = get_mime_type(ext)
    base64_data = base64.b64encode(data).decode("ascii")
    return f"data:{mime_type};base64,{base64_data}"


def serialize(obj: Any) -> Any:
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    elif isinstance(obj, (list, tuple, set)):
        return [serialize(x) for x in obj]
    elif isinstance(obj, dict):
        # Check for HuggingFace media struct
        if _is_huggingface_media(obj):
            return {
                "bytes": _to_data_url(obj["bytes"], obj["path"]),
                "path": obj["path"],
            }
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, bytes):
        return f"Bytes {len(obj)}"
    return obj
