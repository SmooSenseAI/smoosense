"""
SenseDB CLI - Command-line tool for managing Lance tables.

This tool provides commands for creating and managing Lance tables for images and videos.
"""

from typing import Tuple

import click

from smoosense.db.images import add_images_to_lance
from smoosense.db.utils import process_path_patterns
from smoosense.my_logging import getLogger

# Configure logging
logger = getLogger(__name__)


@click.group()
def cli() -> None:
    """SenseDB - Manage Lance tables for images and videos."""
    pass


@cli.group()
def images() -> None:
    """Manage image Lance tables."""
    pass


@cli.group()
def videos() -> None:
    """Manage video Lance tables."""
    pass


@images.command()
@click.argument('path_patterns', nargs=-1)
def add(path_patterns: Tuple[str, ...]) -> None:
    """Add images to a Lance table.

    PATH_PATTERNS: Glob pattern (quoted) OR list of files (unquoted, shell-expanded)

    \b
    Pattern Mode (quoted - we do the globbing):
        sensedb images add "*.jpg"
        sensedb images add "photos/**/*.png"
        sensedb images add "~/images/*.jpeg"

    \b
    File List Mode (unquoted - shell expands):
        sensedb images add image1.jpg image2.jpg
        sensedb images add *.jpg  (if only a few files, shell expands)

    \b
    Note: For large directories, ALWAYS quote the pattern to avoid
    "Argument list too long" errors!
    """
    logger.info("Starting 'sensedb images add' command")
    matched_files = process_path_patterns(
        path_patterns=path_patterns,
        table_name='images',
        prompt_message='Enter glob pattern for image files'
    )

    if not matched_files:
        return

    click.echo("\nActions to be performed:")
    click.echo("  1. Create table 'images.lance' if not exists in current folder")
    click.echo(f"  2. Insert {len(matched_files)} image files")
    click.echo("  3. Extract image metadata (dimensions, format, etc.)")
    click.echo("  4. Generate CLIP embeddings for each image")
    click.echo("  5. Compute UMAP 2D coordinates (emb_x, emb_y)")
    click.echo("  6. Add images to Lance table")
    click.echo("\n" + "="*60)

    # Ask for confirmation
    if not click.confirm("Proceed with adding images?", default=True):
        logger.info("User cancelled operation")
        click.echo("Cancelled.")
        return

    # Add images to Lance table
    logger.info(f"Starting to add {len(matched_files)} images to Lance table")
    try:
        success_count = add_images_to_lance(
            image_paths=matched_files,
            db_path='.',
            model_name='ViT-B-32',
            pretrained='openai',
            batch_size=32
        )

        logger.info(f"Successfully added {success_count} images to Lance table")
        click.echo("\n" + "="*60)
        click.echo(f"✅ Successfully added {success_count} images to Lance table!")
        click.echo(f"📊 Table location: ./images.lance")
        click.echo("="*60 + "\n")

    except Exception as e:
        logger.error(f"Failed to add images to Lance table: {e}", exc_info=True)
        click.echo("\n" + "="*60)
        click.echo(f"❌ Error: {e}")
        click.echo("="*60 + "\n")
        raise


@videos.command()
@click.argument('path_patterns', nargs=-1)
def add(path_patterns: Tuple[str, ...]) -> None:
    """Add videos to a Lance table.

    PATH_PATTERNS: Glob pattern (quoted) OR list of files (unquoted, shell-expanded)

    \b
    Pattern Mode (quoted - we do the globbing):
        sensedb videos add "*.mp4"
        sensedb videos add "videos/**/*.mov"
        sensedb videos add "~/videos/*.avi"

    \b
    File List Mode (unquoted - shell expands):
        sensedb videos add video1.mp4 video2.mp4
        sensedb videos add *.mp4  (if only a few files, shell expands)

    \b
    Note: For large directories, ALWAYS quote the pattern to avoid
    "Argument list too long" errors!
    """
    logger.info("Starting 'sensedb videos add' command")
    matched_files = process_path_patterns(
        path_patterns=path_patterns,
        table_name='videos',
        prompt_message='Enter glob pattern for video files'
    )

    if not matched_files:
        return

    click.echo("\nActions to be performed:")
    click.echo("  1. Check if 'videos.lance' table exists in current folder")
    click.echo("  2. If not exists, create new Lance table 'videos'")
    click.echo(f"  3. Process {len(matched_files)} video files")
    click.echo("  4. Extract video metadata (duration, resolution, codec, etc.)")
    click.echo("  5. Generate embeddings for each video")
    click.echo("  6. Add videos to Lance table")
    click.echo("\n" + "="*60)
    click.echo("🚧 Implementation coming soon...")
    click.echo("="*60 + "\n")


def main() -> None:
    """Main entry point for sensedb CLI."""
    cli()


if __name__ == "__main__":
    main()
