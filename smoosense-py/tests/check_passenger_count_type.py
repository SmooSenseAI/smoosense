#!/usr/bin/env python3
"""
Temporary script to check passenger_count column type in NYC Taxi parquet files.
"""

import sys
import os

# Add parent directory to path to import smoosense modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import boto3
from smoosense.utils.duckdb_connections import duckdb_connection_using_s3

def main():
    """Check passenger_count type in all parquet files."""
    bucket = "smoosense-demo"
    prefix = "datasets/NYCTaxi/"

    # Initialize S3 client
    s3_client = boto3.client("s3")

    # Create DuckDB connection with S3 authentication
    connection_maker = duckdb_connection_using_s3(s3_client)
    con = connection_maker()

    print(f"Checking parquet files in s3://{bucket}/{prefix}\n", flush=True)
    print("=" * 80, flush=True)

    # List all objects in the prefix
    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix=prefix)

    double_type_files = []
    other_type_files = []
    no_column_files = []
    error_files = []

    for page in pages:
        if "Contents" not in page:
            continue

        for obj in page["Contents"]:
            key = obj["Key"]

            # Skip non-parquet files
            if not key.endswith(".parquet"):
                continue

            s3_path = f"s3://{bucket}/{key}"
            file_name = key.split("/")[-1]

            try:
                # Use DuckDB DESCRIBE to get schema
                result = con.execute(f"DESCRIBE SELECT * FROM '{s3_path}'").fetchall()

                # Convert to dict mapping column_name -> column_type
                schema = {row[0]: row[1] for row in result}

                # Check if passenger_count column exists
                if "passenger_count" in schema:
                    field_type = schema["passenger_count"]

                    # DuckDB uses DOUBLE for float64
                    if field_type == "DOUBLE":
                        double_type_files.append((file_name, field_type))
                        print(f"✓ {file_name:50} passenger_count: {field_type}", flush=True)
                    else:
                        other_type_files.append((file_name, field_type))
                        print(f"  {file_name:50} passenger_count: {field_type}", flush=True)
                else:
                    no_column_files.append(file_name)
                    print(f"✗ {file_name:50} NO passenger_count column", flush=True)

            except Exception as e:
                error_files.append((file_name, str(e)))
                print(f"✗ {file_name:50} ERROR: {e}", flush=True)

    # Close DuckDB connection
    con.close()

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nFiles with passenger_count as DOUBLE: {len(double_type_files)}")
    for file_name, _ in double_type_files:
        print(f"  - {file_name}")

    print(f"\nFiles with passenger_count as other types: {len(other_type_files)}")
    for file_name, field_type in other_type_files:
        print(f"  - {file_name} ({field_type})")

    if no_column_files:
        print(f"\nFiles without passenger_count column: {len(no_column_files)}")
        for file_name in no_column_files:
            print(f"  - {file_name}")

    if error_files:
        print(f"\nFiles with errors: {len(error_files)}")
        for file_name, error in error_files:
            print(f"  - {file_name}: {error}")

    print(f"\nTotal files processed: {len(double_type_files) + len(other_type_files) + len(no_column_files) + len(error_files)}")


if __name__ == "__main__":
    main()
