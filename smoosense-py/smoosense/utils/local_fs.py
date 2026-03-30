import fnmatch
import logging
import os

from pydantic import validate_call

from smoosense.utils.models import FSItem, SortBy, SortOrder

logger = logging.getLogger(__name__)


class LocalFileSystem:
    @staticmethod
    @validate_call
    def list_one_level(
        path: str,
        limit: int = 10,
        offset: int = 0,
        sort_by: SortBy = "name",
        sort_order: SortOrder = "asc",
        show_hidden: bool = False,
        pattern: str = "",
    ) -> tuple[list[FSItem], int]:
        if path.startswith("~"):
            path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path {path} does not exist")

        all_items: list[FSItem] = []
        for entry in os.scandir(path):
            if entry.name.startswith(".") and not show_hidden:
                continue
            all_items.append(
                FSItem(
                    name=entry.name,
                    size=entry.stat().st_size,
                    lastModified=int(1000 * entry.stat().st_mtime),
                    isDir=entry.is_dir(),
                )
            )

        if pattern:
            all_items = [
                item for item in all_items if fnmatch.fnmatch(item.name.lower(), pattern.lower())
            ]

        reverse = sort_order == "desc"
        if sort_by == "size":
            all_items.sort(key=lambda x: x.size, reverse=reverse)
        elif sort_by == "modified":
            all_items.sort(key=lambda x: x.lastModified, reverse=reverse)
        else:
            all_items.sort(key=lambda x: x.name.lower(), reverse=reverse)

        total = len(all_items)
        return all_items[offset : offset + limit], total
