#!/usr/bin/env python3
"""
Script to compare schemas of NYC Taxi parquet files against a baseline.
"""

import os
from pathlib import Path
import duckdb

def main():
    """Compare schema of all parquet files against baseline."""
    data_dir = Path("/Users/senlin/Work/sense-table-demo-data/datasets/nyc_taxi")
    baseline_file = "yellow_tripdata_2009-01.parquet"
    baseline_path = data_dir / baseline_file

    if not baseline_path.exists():
        print(f"ERROR: Baseline file not found: {baseline_path}")
        return

    # Initialize DuckDB connection
    con = duckdb.connect()

    # Get baseline schema
    print(f"Reading baseline schema from: {baseline_file}\n", flush=True)
    baseline_result = con.execute(f"DESCRIBE SELECT * FROM '{baseline_path}'").fetchall()
    baseline_schema = {row[0]: row[1] for row in baseline_result}

    print(f"Baseline schema ({len(baseline_schema)} columns):")
    for col_name, col_type in baseline_schema.items():
        print(f"  {col_name:30} {col_type}")
    print("\n" + "=" * 80)
    print("COMPARING ALL FILES TO BASELINE")
    print("=" * 80 + "\n", flush=True)

    # Get all parquet files sorted
    parquet_files = sorted([f for f in data_dir.glob("*.parquet")])

    files_with_differences = []
    files_without_differences = []

    for parquet_file in parquet_files:
        file_name = parquet_file.name

        # Skip the baseline file itself
        if file_name == baseline_file:
            continue

        try:
            # Get schema for current file
            result = con.execute(f"DESCRIBE SELECT * FROM '{parquet_file}'").fetchall()
            current_schema = {row[0]: row[1] for row in result}

            # Find differences
            differences = []

            # Check for columns in baseline but not in current
            missing_cols = set(baseline_schema.keys()) - set(current_schema.keys())
            for col in missing_cols:
                differences.append(f"  MISSING: {col} (was {baseline_schema[col]})")

            # Check for columns in current but not in baseline
            extra_cols = set(current_schema.keys()) - set(baseline_schema.keys())
            for col in extra_cols:
                differences.append(f"  EXTRA:   {col} ({current_schema[col]})")

            # Check for columns with different types
            common_cols = set(baseline_schema.keys()) & set(current_schema.keys())
            for col in sorted(common_cols):
                if baseline_schema[col] != current_schema[col]:
                    differences.append(f"  TYPE:    {col:30} {baseline_schema[col]:15} -> {current_schema[col]}")

            # Report results
            if differences:
                files_with_differences.append(file_name)
                print(f"✗ {file_name}")
                for diff in differences:
                    print(diff)
                print(flush=True)
            else:
                files_without_differences.append(file_name)
                print(f"✓ {file_name:50} (identical)", flush=True)

        except Exception as e:
            print(f"✗ {file_name:50} ERROR: {e}", flush=True)

    # Close connection
    con.close()

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nFiles with identical schema: {len(files_without_differences)}")

    print(f"\nFiles with schema differences: {len(files_with_differences)}")
    for file_name in files_with_differences:
        print(f"  - {file_name}")

    print(f"\nTotal files compared: {len(parquet_files) - 1} (excluding baseline)")


if __name__ == "__main__":
    main()
