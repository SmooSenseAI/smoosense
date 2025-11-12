from typing import Optional

from pydantic import BaseModel, Field


class TableInfo(BaseModel):
    """Information about a Lance table."""

    name: str = Field(..., description="Name of the table")
    cnt_rows: Optional[int] = Field(None, description="Number of rows in the table")
    cnt_columns: Optional[int] = Field(None, description="Number of columns in the table")
    cnt_versions: Optional[int] = Field(None, description="Number of versions of the table")
    cnt_indices: Optional[int] = Field(None, description="Number of indices of the table")


class VersionInfo(BaseModel):
    """Information about a table version."""

    version: int = Field(..., description="Version number")
    timestamp: int = Field(..., description="Unix timestamp (epoch) of the version")
    total_data_files: Optional[int] = Field(
        None, description="Total number of data files in this version"
    )
    total_rows: Optional[int] = Field(None, description="Total number of rows in this version")
    rows_add: Optional[int] = Field(
        None, description="Number of rows added compared to previous version"
    )
    rows_remove: Optional[int] = Field(
        None, description="Number of rows deleted compared to previous version"
    )
    columns_add: list[str] = Field(
        default_factory=list, description="New columns compared to previous version"
    )
    columns_remove: list[str] = Field(
        default_factory=list, description="Columns removed compared to previous version"
    )
    indices_add: list[str] = Field(
        default_factory=list, description="New indices compared to previous version"
    )
    indices_remove: list[str] = Field(
        default_factory=list, description="Indices removed compared to previous version"
    )


class IndexInfo(BaseModel):
    """Information about a Lance index."""

    name: str = Field(..., description="Name of the index")
    index_type: str = Field(..., description="Type of the index (e.g., IVF_PQ, BTREE)")
    columns: list[str] = Field(..., description="Columns included in the index")
    num_unindexed_rows: Optional[int] = Field(
        None, description="Number of unindexed rows in the index"
    )


class ColumnInfo(BaseModel):
    """Information about a table column."""

    name: str = Field(..., description="Name of the column")
    type: str = Field(..., description="Data type of the column")
