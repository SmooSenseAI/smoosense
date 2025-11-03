"""
Utility functions for database operations.
"""

import glob
import os
from typing import List, Tuple

import click

from smoosense.my_logging import getLogger

logger = getLogger(__name__)


def process_path_patterns(
    path_patterns: Tuple[str, ...],
    table_name: str,
    prompt_message: str
) -> List[str]:
    """
    Process path patterns and display summary.

    Handles both pattern mode (quoted, we do globbing) and file list mode
    (unquoted, shell already expanded).

    Args:
        path_patterns: Tuple of path patterns or file paths from CLI
        table_name: Name of the table (e.g., "images", "videos")
        prompt_message: Message to show when prompting for pattern

    Returns:
        List of matched file paths
    """
    # Prompt for path pattern if not provided
    if not path_patterns:
        path_pattern = click.prompt(
            prompt_message,
            type=str
        )
        path_patterns = (path_pattern,)

    # Determine mode: pattern vs file list
    is_pattern_mode = (
        len(path_patterns) == 1 and
        ('*' in path_patterns[0] or '?' in path_patterns[0] or '[' in path_patterns[0])
    )

    if is_pattern_mode:
        # Pattern mode - we do the globbing
        mode = "Pattern"
        pattern = path_patterns[0]
        expanded_pattern = os.path.expanduser(pattern)
        logger.info(f"Processing pattern: {pattern}")
        matched_files = glob.glob(expanded_pattern, recursive=True)
        logger.info(f"Pattern matched {len(matched_files)} files")
    else:
        # File list mode - shell already expanded
        mode = "File List"
        pattern = f"{len(path_patterns)} files provided"
        matched_files = [os.path.expanduser(f) for f in path_patterns]

    # Display summary
    click.echo("\n" + "="*60)
    click.echo(f"SENSEDB {table_name.upper()} ADD - Action Summary")
    click.echo("="*60)
    click.echo(f"\nMode: {mode}")
    click.echo(f"Table name: {table_name}")
    click.echo(f"Location: {click.format_filename('.')}/{table_name}.lance")

    if len(matched_files) == 0:
        logger.warning(f"No files matched the pattern: {pattern}")
        click.echo("\n�  No files matched the pattern!")
        click.echo("="*60 + "\n")
        return []

    # Show first few matches as examples
    if len(matched_files) > 0:
        click.echo(f"\nFirst {min(5, len(matched_files))} matched files:")
        for i, file_path in enumerate(matched_files[:5], 1):
            click.echo(f"  {i}. {file_path}")

    return matched_files
