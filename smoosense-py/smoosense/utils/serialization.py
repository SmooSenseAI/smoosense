import logging
import math
from typing import Any

logger = logging.getLogger(__name__)


def serialize(obj: Any) -> Any:
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    elif isinstance(obj, (list, tuple, set)):
        return [serialize(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, bytes):
        return f"Bytes {len(obj)}"
    return obj
