import logging
import os

from pydantic import validate_call

from smoosense.utils.models import FSItem

logger = logging.getLogger(__name__)


class LocalFileSystem:
    @staticmethod
    @validate_call
    def list_one_level(path: str, limit: int = 100, show_hidden: bool = False) -> list[FSItem]:
        if path.startswith("~"):
            path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path {path} does not exist")

        items = []
        for entry in os.scandir(path):
            if entry.name.startswith(".") and not show_hidden:
                continue
            items.append(
                FSItem(
                    name=entry.name,
                    size=entry.stat().st_size,
                    lastModified=int(1000 * entry.stat().st_mtime),
                    isDir=entry.is_dir(),
                )
            )
            if len(items) >= limit:
                break
        return items
