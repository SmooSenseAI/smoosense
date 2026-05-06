# models/base.py
from typing import Literal

from pydantic import BaseModel, Extra


class ImmutableBaseModel(BaseModel):
    class Config:
        frozen = True
        extra = Extra.forbid


class FSItem(ImmutableBaseModel):
    name: str
    size: int
    lastModified: int
    isDir: bool
    isBrokenSymlink: bool = False
    symlinkTarget: str = ""


SortBy = Literal["name", "size", "modified"]
SortOrder = Literal["asc", "desc"]


class FSListResponse(ImmutableBaseModel):
    items: list[FSItem]
    total: int
    offset: int
    limit: int
