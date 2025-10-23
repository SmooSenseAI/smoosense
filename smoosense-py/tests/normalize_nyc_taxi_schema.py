#!/usr/bin/env python3
"""
Script to normalize NYC Taxi parquet files to consistent schema.
- Remove __index_level_0__ if exists
- Cast passenger_count to BIGINT
- Cast payment_type to VARCHAR
- Use zstd compression
"""

import os
from pathlib import Path
import duckdb

def main():
    """Normalize schema of all parquet files."""
    data_dir = Path("/Users/senlin/Work/sense-table-demo-data/datasets/nyc_taxi")
    backup_dir = data_dir / "backup_original"

    # Create backup directory
    backup_dir.mkdir(exist_ok=True)
    print(f"Backup directory: {backup_dir}\n")

    # Initialize DuckDB connection
    con = duckdb.connect()

    # Get all parquet files sorted
    parquet_files = sorted([f for f in data_dir.glob("*.parquet")])

    print(f"Found {len(parquet_files)} parquet files to normalize\n")
    print("=" * 80)

    normalized_count = 0
    skipped_count = 0
    error_count = 0

    for parquet_file in parquet_files:
        file_name = parquet_file.name

        try:
            # Get current schema
            result = con.execute(f"DESCRIBE SELECT * FROM '{parquet_file}'").fetchall()
            current_schema = {row[0]: row[1] for row in result}

            # Check if normalization is needed
            needs_normalization = False
            changes = []

            if "__index_level_0__" in current_schema:
                needs_normalization = True
                changes.append("remove __index_level_0__")

            if current_schema.get("passenger_count") == "DOUBLE":
                needs_normalization = True
                changes.append("passenger_count DOUBLE->BIGINT")

            if current_schema.get("payment_type") == "BIGINT":
                needs_normalization = True
                changes.append("payment_type BIGINT->VARCHAR")

            if not needs_normalization:
                print(f"⊙ {file_name:50} (already normalized)", flush=True)
                skipped_count += 1
                continue

            # Build SELECT statement with transformations
            select_cols = []
            for col_name in current_schema.keys():
                # Skip __index_level_0__
                if col_name == "__index_level_0__":
                    continue

                # Cast passenger_count to BIGINT if it's DOUBLE
                if col_name == "passenger_count" and current_schema[col_name] == "DOUBLE":
                    select_cols.append(f"CAST({col_name} AS BIGINT) AS {col_name}")
                # Cast payment_type to VARCHAR if it's BIGINT
                elif col_name == "payment_type" and current_schema[col_name] == "BIGINT":
                    select_cols.append(f"CAST({col_name} AS VARCHAR) AS {col_name}")
                else:
                    select_cols.append(col_name)

            select_clause = ", ".join(select_cols)

            # Create temporary output file
            temp_file = parquet_file.parent / f"{parquet_file.stem}_normalized.parquet"
            backup_file = backup_dir / file_name

            # Backup original file
            import shutil
            shutil.copy2(parquet_file, backup_file)

            # Normalize and write with zstd compression
            query = f"""
                COPY (
                    SELECT {select_clause}
                    FROM '{parquet_file}'
                ) TO '{temp_file}' (
                    FORMAT PARQUET,
                    COMPRESSION ZSTD
                )
            """
            con.execute(query)

            # Replace original with normalized version
            os.replace(temp_file, parquet_file)

            print(f"✓ {file_name:50} [{', '.join(changes)}]", flush=True)
            normalized_count += 1

        except Exception as e:
            print(f"✗ {file_name:50} ERROR: {e}", flush=True)
            error_count += 1

    # Close connection
    con.close()

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nFiles normalized: {normalized_count}")
    print(f"Files already correct: {skipped_count}")
    print(f"Files with errors: {error_count}")
    print(f"\nTotal files processed: {len(parquet_files)}")
    print(f"\nOriginal files backed up to: {backup_dir}")


if __name__ == "__main__":
    main()
