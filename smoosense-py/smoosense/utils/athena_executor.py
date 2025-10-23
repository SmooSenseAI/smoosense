"""
Athena query executor using awswrangler.

This module provides functionality to execute SQL queries on AWS Athena
and retrieve column metadata, mimicking the same output format as DuckDB.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import awswrangler as wr

logger = logging.getLogger(__name__)


def transform_query_for_athena(query: str) -> str:
    """
    Transform DuckDB-style query to Athena-compatible query.

    Changes:
    - Strips catalog prefix: AwsDataCatalog.db.table -> db.table
    - Handles both quoted and unquoted table references

    Args:
        query: Original SQL query (potentially with DuckDB syntax)

    Returns:
        Athena-compatible SQL query
    """

    def replace_table_ref(match: re.Match[str]) -> str:
        keyword = match.group(1)  # FROM or JOIN
        table_ref = match.group(2)  # The table reference (with or without quotes)

        # Remove quotes if present
        table_ref = table_ref.strip("'\"")

        # Split by dots to handle catalog.database.table
        parts = table_ref.split(".")

        # Strip catalog if present (3 parts: catalog.database.table -> database.table)
        if len(parts) == 3:
            # Remove catalog prefix
            table_ref = f"{parts[1]}.{parts[2]}"
        # If 2 parts (database.table), keep as is
        # If 1 part (table), keep as is

        return f"{keyword} {table_ref}"

    # Transform table references in FROM/JOIN clauses (with or without quotes)
    # Match both: FROM 'table' and FROM table
    result = re.sub(
        r"\b(FROM|JOIN)\s+('[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*'|[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)",
        replace_table_ref,
        query,
        flags=re.IGNORECASE,
    )

    return result


def extract_database_from_query(query: str) -> str | None:
    """
    Extract database name from SQL query.

    Looks for patterns like:
    - FROM catalog.database.table
    - FROM database.table
    - FROM 'catalog.database.table' (with quotes)

    Returns:
        Database name if found, None otherwise
    """
    # Remove comments and normalize whitespace
    query_clean = re.sub(r"--.*$", "", query, flags=re.MULTILINE)
    query_clean = re.sub(r"/\*.*?\*/", "", query_clean, flags=re.DOTALL)
    query_clean = " ".join(query_clean.split())

    # Pattern to match FROM clause with table references
    # Matches: FROM table_ref or FROM 'table_ref'
    from_pattern = r"FROM\s+['\"]?([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+){1,2})['\"]?"

    matches = re.finditer(from_pattern, query_clean, re.IGNORECASE)

    for match in matches:
        table_ref = match.group(1)
        parts = table_ref.split(".")

        if len(parts) == 3:
            # catalog.database.table
            return parts[1]
        elif len(parts) == 2:
            # database.table
            return parts[0]

    return None


def is_describe_query(query: str) -> tuple[bool, str | None, str | None]:
    """
    Check if a query is a DESCRIBE statement.

    Args:
        query: SQL query to check

    Returns:
        Tuple of (is_describe, database, table_name)
        - is_describe: True if query is DESCRIBE
        - database: Database name if found
        - table_name: Table name if found
    """
    # Pattern: DESCRIBE [database.]table
    pattern = r"^\s*DESCRIBE\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*$"
    match = re.match(pattern, query.strip(), re.IGNORECASE)

    if match:
        database = match.group(1)  # May be None
        table = match.group(2)
        return True, database, table

    return False, None, None


def execute_describe_via_catalog(
    database: str, table: str
) -> tuple[list[str], list[list[Any]]]:
    """
    Execute DESCRIBE by fetching table metadata from AWS Glue Catalog.

    Args:
        database: Database name
        table: Table name

    Returns:
        Tuple of (column_names, rows) in DESCRIBE format:
        - column_names: ['col_name', 'data_type', 'comment']
        - rows: List of [column_name, data_type, comment] for each column
    """
    try:
        # Get table information from Glue Catalog
        table_info = wr.catalog.get_table_location(database=database, table=table)
        logger.debug(f"Got table location: {table_info}")

        # Get column types
        columns_dict = wr.catalog.get_table_types(database=database, table=table)

        if not columns_dict:
            raise ValueError(f"No columns found for table {database}.{table}")

        # Build result in DESCRIBE format
        column_names = ["col_name", "data_type", "comment"]
        rows = []

        for col_name, col_type in columns_dict.items():
            # Map Athena type to DuckDB-like type
            duckdb_type = _map_athena_type_to_duckdb(col_type)
            rows.append([col_name, duckdb_type, ""])  # Empty comment

        logger.info(f"Retrieved metadata for {database}.{table}: {len(rows)} columns")
        return column_names, rows

    except Exception as e:
        logger.error(f"Failed to get table metadata for {database}.{table}: {e}")
        raise


def execute_athena_query(
    query: str, database: str | None = None, workgroup: str | None = None
) -> tuple[list[str], list[list[Any]]]:
    """
    Execute a SQL query using AWS Athena and return results in DuckDB-compatible format.

    Special handling:
    - DESCRIBE queries are executed via AWS Glue Catalog instead of SQL

    Args:
        query: SQL query to execute
        database: Athena database name (optional, will be auto-extracted from query if not provided)
        workgroup: Athena workgroup to use (optional, defaults to primary)

    Returns:
        Tuple of (column_names, rows) where:
        - column_names: List of column names
        - rows: List of rows, where each row is a list of values

    Raises:
        Exception: If query execution fails
    """
    try:
        # Check if this is a DESCRIBE query
        is_describe, desc_db, desc_table = is_describe_query(query)
        if is_describe and desc_table:
            # Use database from query or fall back to provided database
            target_db = desc_db or database
            if not target_db:
                raise ValueError("Database must be specified for DESCRIBE query")

            logger.info(f"Executing DESCRIBE via Glue Catalog: {target_db}.{desc_table}")
            return execute_describe_via_catalog(target_db, desc_table)

        # Transform query from DuckDB syntax to Athena syntax
        athena_query = transform_query_for_athena(query)
        logger.debug(f"Transformed query: {athena_query}")

        # Auto-extract database from query if not provided
        if database is None:
            database = extract_database_from_query(athena_query)
            if database:
                logger.info(f"Auto-extracted database from query: {database}")

        # Build kwargs for read_sql_query
        kwargs: dict[str, Any] = {"sql": athena_query, "ctas_approach": False}
        if database is not None:
            kwargs["database"] = 'default'
        if workgroup is not None:
            kwargs["workgroup"] = workgroup

        # Execute query and get pandas DataFrame
        df = wr.athena.read_sql_query(**kwargs)

        # Extract column names
        column_names = df.columns.tolist()

        # Convert DataFrame to list of lists (rows)
        # Replace all pandas null types (NaN, NaT, pd.NA) with None for JSON serialization
        # Convert to object dtype first to allow None values, then use where() to replace nulls
        df = df.astype(object).where(df.notna(), None)
        rows = df.values.tolist()

        return column_names, rows

    except Exception as e:
        logger.error(f"Athena query failed: {e}")
        raise


def get_athena_column_metadata(
    table_path: str, database: str | None = None, workgroup: str | None = None
) -> list[dict[str, Any]]:
    """
    Get column metadata from an Athena table.

    Args:
        table_path: Full table path in format 'catalog.database.table' or 'database.table'
        database: Default database if not specified in table_path
        workgroup: Athena workgroup to use (optional)

    Returns:
        List of dictionaries with column metadata:
        [{
            'column_name': str,
            'column_type': str (Athena/Hive type mapped to DuckDB-like type)
        }, ...]
    """
    try:
        # Parse table path to extract catalog, database, and table
        parts = table_path.split(".")
        if len(parts) == 3:
            catalog, db, table = parts
        elif len(parts) == 2:
            catalog = "AwsDataCatalog"  # Default catalog
            db, table = parts
        elif len(parts) == 1:
            catalog = "AwsDataCatalog"
            db = database or "default"
            table = parts[0]
        else:
            raise ValueError(f"Invalid table path format: {table_path}")

        # Use awswrangler to get table metadata
        # This returns a dictionary with column names as keys and types as values
        columns_dict = wr.catalog.get_table_types(
            database=db, table=table, catalog_id=catalog
        )

        # Convert to list of dicts in DuckDB DESCRIBE format
        columns = []
        if columns_dict:
            for col_name, col_type in columns_dict.items():
                # Map Athena/Hive types to DuckDB-like types
                duckdb_type = _map_athena_type_to_duckdb(col_type)
                columns.append({"column_name": col_name, "column_type": duckdb_type})

        return columns

    except Exception as e:
        logger.error(f"Failed to get Athena column metadata for {table_path}: {e}")
        raise


def _map_athena_type_to_duckdb(athena_type: str) -> str:
    """
    Map Athena/Hive data types to DuckDB-compatible type names.

    This helps maintain consistency between DuckDB and Athena query results.
    """
    # Normalize to lowercase for comparison
    athena_type_lower = athena_type.lower()

    # Simple type mappings
    type_map = {
        "string": "VARCHAR",
        "varchar": "VARCHAR",
        "char": "VARCHAR",
        "int": "INTEGER",
        "integer": "INTEGER",
        "bigint": "BIGINT",
        "smallint": "SMALLINT",
        "tinyint": "TINYINT",
        "double": "DOUBLE",
        "float": "FLOAT",
        "decimal": "DECIMAL",
        "boolean": "BOOLEAN",
        "date": "DATE",
        "timestamp": "TIMESTAMP",
        "binary": "BLOB",
        "array": "LIST",
        "map": "MAP",
        "struct": "STRUCT",
    }

    # Check for exact match
    if athena_type_lower in type_map:
        return type_map[athena_type_lower]

    # Handle complex types (array<type>, map<k,v>, struct<...>)
    for athena_prefix, _ in [
        ("array<", "LIST"),
        ("map<", "MAP"),
        ("struct<", "STRUCT"),
    ]:
        if athena_type_lower.startswith(athena_prefix):
            # For complex types, try to preserve the inner structure
            # but this is a simplified mapping
            return athena_type.upper()

    # Default: return original type in uppercase
    logger.warning(f"Unknown Athena type '{athena_type}', using as-is")
    return athena_type.upper()
