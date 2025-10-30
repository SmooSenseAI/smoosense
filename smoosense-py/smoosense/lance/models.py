from typing import Any, Optional

from pydantic import BaseModel, Field


class TableInfo(BaseModel):
    """Information about a Lance table."""

    name: str = Field(..., description="Name of the table")
    cnt_rows: Optional[int] = Field(None, description="Number of rows in the table")
    cnt_columns: Optional[int] = Field(None, description="Number of columns in the table")
    cnt_versions: Optional[int] = Field(None, description="Number of versions of the table")


class VersionInfo(BaseModel):
    """Information about a table version."""

    version: int = Field(..., description="Version number")
    timestamp: int = Field(..., description="Unix timestamp (epoch) of the version")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Version metadata")
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
