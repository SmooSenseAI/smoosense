#!/usr/bin/env python3
"""
Convert a Parquet file to Lance format.

For double[] or float[] columns, checks if all non-null rows have the same length.
If so, converts them to fixed-size arrays.
"""

import os
import re
from typing import Optional

import click
import lancedb
import pyarrow as pa
import pyarrow.parquet as pq


def sanitize_table_name(name: str) -> str:
    """
    Sanitize a string to be used as a table name.
    Replace non-alphanumeric characters with underscores.
    """
    return re.sub(r"[^a-zA-Z0-9]", "_", name)


def get_list_element_size(column: pa.ChunkedArray) -> Optional[int]:
    """
    Check if all non-null values in a list column have the same length.
    Returns the common length if consistent, None otherwise.
    """
    common_size: Optional[int] = None

    for chunk in column.chunks:
        for i in range(len(chunk)):
            if chunk[i].is_valid:
                val = chunk[i].as_py()
                if val is not None:
                    size = len(val)
                    if common_size is None:
                        common_size = size
                    elif size != common_size:
                        return None

    return common_size


def convert_to_fixed_size_list(column: pa.ChunkedArray, size: int) -> pa.ChunkedArray:
    """
    Convert a variable-length list column to a fixed-size list column.
    """
    # Get the element type from the original column
    list_type = column.type
    if not pa.types.is_list(list_type):
        raise ValueError(f"Expected list type, got {list_type}")

    element_type = list_type.value_type
    fixed_type = pa.list_(element_type, size)

    # Convert each chunk
    new_chunks = []
    for chunk in column.chunks:
        data = [val.as_py() if val.is_valid else None for val in chunk]
        new_chunk = pa.array(data, type=fixed_type)
        new_chunks.append(new_chunk)

    return pa.chunked_array(new_chunks)


def is_float_or_double_list(col_type: pa.DataType) -> bool:
    """Check if a column type is a list of floats or doubles."""
    if not pa.types.is_list(col_type):
        return False
    element_type = col_type.value_type
    return bool(pa.types.is_floating(element_type))


def get_embedding_columns(schema: pa.Schema, min_dim: int = 10) -> list[str]:
    """
    Find columns that are likely embeddings (fixed-size float/double arrays with dim > min_dim).
    """
    embedding_cols = []
    for field in schema:
        if pa.types.is_fixed_size_list(field.type):
            element_type = field.type.value_type
            list_size = field.type.list_size
            if pa.types.is_floating(element_type) and list_size > min_dim:
                embedding_cols.append(field.name)
    return embedding_cols


# Minimum rows required to build vector index
MIN_ROWS_FOR_INDEX = 256


@click.command()
@click.argument("parquet_path", type=click.Path(exists=True))
@click.argument("lance_path", type=click.Path())
def main(parquet_path: str, lance_path: str) -> None:
    """
    Convert a Parquet file to Lance format.

    \b
    PARQUET_PATH: Input Parquet file
    LANCE_PATH:   Output Lance table path
                  • Parent directory = database
                  • Basename = table name
                  • Example: /db/my_table.lance → db=/db, table=my_table

    \b
    Features:
      ✦ Converts float[]/double[] to fixed-size arrays
      ✦ Builds vector index for embeddings (dim > 10)
      ✦ Appends as new version if table exists

    \b
    Examples:
      parquet-to-lance data.parquet ./my_db/my_table.lance
      parquet-to-lance emb.parquet /data/lance_db/embeddings
    """
    # Extract db_path and table_name from lance_path
    lance_path = os.path.abspath(lance_path)
    db_path = os.path.dirname(lance_path)
    table_name_raw = os.path.basename(lance_path)
    # Remove .lance extension if present
    if table_name_raw.endswith(".lance"):
        table_name_raw = table_name_raw[:-6]
    table_name = sanitize_table_name(table_name_raw)
    print(f"📖 Reading: {parquet_path}")
    table = pq.read_table(parquet_path)

    print(f"📊 Rows: {table.num_rows:,}, Columns: {table.num_columns}")

    # Find float/double list columns and check if they can be converted to fixed-size
    conversions: dict[str, int] = {}

    for col_name in table.column_names:
        col = table.column(col_name)
        col_type = col.type

        if is_float_or_double_list(col_type):
            print(f"🔍 Checking column '{col_name}' ({col_type})...")
            size = get_list_element_size(col)

            if size is not None:
                print(f"   ✓ All non-null values have length {size}, will convert to fixed-size")
                conversions[col_name] = size
            else:
                print("   ⊘ Variable length, keeping as-is")

    # Apply conversions
    if conversions:
        print(f"🔄 Converting {len(conversions)} column(s) to fixed-size arrays...")

        for col_name, size in conversions.items():
            col_idx = table.column_names.index(col_name)
            old_col = table.column(col_name)
            new_col = convert_to_fixed_size_list(old_col, size)
            table = table.set_column(col_idx, col_name, new_col)
            print(f"   ✓ Converted '{col_name}' to fixed_size_list[{size}]")

    # Show final schema
    print("📋 Final schema:")
    for field in table.schema:
        print(f"   {field.name}: {field.type}")

    # Write to Lance
    print(f"💾 Writing to Lance: {db_path} (table: {table_name})")

    db = lancedb.connect(db_path)

    # Check if table exists - if so, add as new version
    existing_tables = db.table_names()
    if table_name in existing_tables:
        print(f"   📝 Table '{table_name}' exists, adding data as new version...")
        lance_table = db.open_table(table_name)
        lance_table.add(table)
    else:
        lance_table = db.create_table(table_name, table)

    # Build vector index for embedding columns if there are enough rows
    num_rows = table.num_rows
    if num_rows >= MIN_ROWS_FOR_INDEX:
        embedding_cols = get_embedding_columns(table.schema)
        if embedding_cols:
            print(f"🔗 Building vector index for {len(embedding_cols)} embedding column(s)...")
            for col_name in embedding_cols:
                print(f"   ⏳ Creating index for '{col_name}'...")
                try:
                    lance_table.create_index(vector_column_name=col_name)
                    print("   ✓ Done.")
                except Exception as e:
                    print(f"   ⚠️ Failed to create index for '{col_name}': {e}")
        else:
            print("ℹ️ No embedding columns found for indexing.")
    else:
        print(
            f"ℹ️ Skipping vector index creation (need at least {MIN_ROWS_FOR_INDEX} rows, "
            f"got {num_rows})."
        )

    print("✅ Done!")


if __name__ == "__main__":
    main()
