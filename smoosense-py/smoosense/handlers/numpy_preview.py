import logging
import os
from typing import Any

import numpy as np
from flask import Blueprint, jsonify
from werkzeug.wrappers import Response

from smoosense.handlers.auth import requires_auth_api
from smoosense.utils.api import handle_api_errors, require_arg

logger = logging.getLogger(__name__)
numpy_bp = Blueprint("numpy_preview", __name__)


def _array_to_preview(arr: np.ndarray) -> dict[str, Any]:
    """Convert a numpy array to a JSON-serializable preview dict."""
    return {
        "shape": list(arr.shape),
        "dtype": str(arr.dtype),
        "size": arr.size,
    }


@numpy_bp.get("/numpy-preview")
@requires_auth_api
@handle_api_errors
def numpy_preview() -> Response:
    path = require_arg("path")

    if path.startswith("~"):
        path = os.path.expanduser(path)

    if not os.path.isfile(path):
        raise FileNotFoundError(f"File not found: {path}")

    ext = os.path.splitext(path)[1].lower()

    if ext == ".npy":
        arr = np.load(path)
        result = {"type": "npy", "arrays": {"data": _array_to_preview(arr)}}
    elif ext == ".npz":
        npz = np.load(path)
        arrays = {}
        for key in npz.files:
            arrays[key] = _array_to_preview(npz[key])
        result = {"type": "npz", "arrays": arrays}
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    return jsonify(result)
