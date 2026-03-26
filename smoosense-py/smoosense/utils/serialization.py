import base64
import logging
import math
import os
from typing import Any

from .mime_types import get_mime_type

logger = logging.getLogger(__name__)

# Magic byte signatures for common media formats
# Each entry: (magic_bytes, offset, extension)
_MAGIC_SIGNATURES: list[tuple[bytes, int, str]] = [
    # Images
    (b"\xff\xd8\xff", 0, ".jpg"),
    (b"\x89PNG\r\n\x1a\n", 0, ".png"),
    (b"GIF87a", 0, ".gif"),
    (b"GIF89a", 0, ".gif"),
    (b"RIFF", 0, ".webp"),  # further checked with WEBP at offset 8
    (b"BM", 0, ".bmp"),
    (b"II\x2a\x00", 0, ".tiff"),
    (b"MM\x00\x2a", 0, ".tiff"),
    # Video
    (b"\x1a\x45\xdf\xa3", 0, ".mkv"),  # EBML (MKV/WebM)
    (b"RIFF", 0, ".avi"),  # further checked with AVI at offset 8
    # Audio
    (b"fLaC", 0, ".flac"),
    (b"OggS", 0, ".ogg"),
    (b"ID3", 0, ".mp3"),
    (b"\xff\xfb", 0, ".mp3"),
    (b"\xff\xf3", 0, ".mp3"),
    (b"\xff\xf2", 0, ".mp3"),
    # PDF
    (b"%PDF", 0, ".pdf"),
]


def _detect_extension_from_magic(data: bytes) -> str | None:
    """Detect file extension from magic bytes. Returns extension like '.jpg' or None."""
    if len(data) < 12:
        return None

    # RIFF container: check sub-format at offset 8
    if data[:4] == b"RIFF":
        sub = data[8:12]
        if sub == b"WEBP":
            return ".webp"
        if sub == b"AVI ":
            return ".avi"
        if sub == b"WAVE":
            return ".wav"
        return None

    # MP4/MOV: 'ftyp' at offset 4
    if data[4:8] == b"ftyp":
        return ".mp4"

    for magic, offset, ext in _MAGIC_SIGNATURES:
        if data[offset : offset + len(magic)] == magic:
            return ext

    return None


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
        ext = _detect_extension_from_magic(obj)
        if ext:
            return {
                "bytes": _to_data_url(obj, f"detected{ext}"),
                "path": f"detected{ext}",
            }
        return f"Bytes {len(obj)}"
    return obj
