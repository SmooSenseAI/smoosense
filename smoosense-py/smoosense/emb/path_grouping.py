"""Utilities for computing group labels from file paths."""

import os
from typing import Optional


def compute_path_groups(file_paths: list[str]) -> Optional[list[str]]:
    """
    Compute group labels based on the differing parts of folder paths.

    Finds common prefix of all parent directories and extracts the uncommon parts.
    Returns None if all files are in the same directory (no grouping needed).

    Examples:
        ["/a/b/c/d/1.mp4", "/a/b/c/d/2.mp4"] -> None (same directory)
        ["/a/b/c/d/1.mp4", "/a/b/c/e/1.mp4"] -> ["d", "e"]
        ["/a/b/c/d/1.mp4", "/a/b/e/d/1.mp4"] -> ["c/d", "e/d"]
    """
    if len(file_paths) < 2:
        return None

    # Get parent directories
    parent_dirs = [os.path.dirname(os.path.abspath(p)) for p in file_paths]

    # Check if all files are in the same directory
    if len(set(parent_dirs)) == 1:
        return None

    # Split into path parts
    split_paths = [p.split(os.sep) for p in parent_dirs]

    # Find common prefix length
    min_len = min(len(p) for p in split_paths)
    common_prefix_len = 0
    for i in range(min_len):
        if len({p[i] for p in split_paths}) == 1:
            common_prefix_len = i + 1
        else:
            break

    # Extract uncommon parts and join them
    groups = []
    for split_path in split_paths:
        uncommon = split_path[common_prefix_len:]
        group = os.sep.join(uncommon) if uncommon else ""
        groups.append(group)

    return groups
