# Folder Browser Pagination & Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sort-by (name/size/modified) and offset-based pagination ("load more") to the folder browser for both local and S3 paths.

**Architecture:** The backend `/api/ls` endpoint grows three new query params (`offset`, `sort_by`, `sort_order`) and returns `{items, total, offset, limit}` instead of a bare array. The frontend Redux state gains `sortBy`/`sortOrder` globals (changing either clears + reloads the tree) and per-node `childrenTotal`; a "load more" pseudo-node is injected at the end of any partially-loaded folder's children list.

**Tech Stack:** Python/Flask + Pydantic + Boto3 (backend); TypeScript + Redux Toolkit + react-arborist (frontend).

---

## File Map

| File | Change |
|------|--------|
| `smoosense-py/smoosense/utils/models.py` | Add `FSListResponse`, `SortBy`, `SortOrder` types |
| `smoosense-py/smoosense/utils/local_fs.py` | Sort + paginate after full scan |
| `smoosense-py/smoosense/utils/s3_fs.py` | Fetch all pages, sort + paginate in memory |
| `smoosense-py/smoosense/handlers/fs.py` | New query params; return `FSListResponse` |
| `smoosense-py/tests/test_fs_ls.py` | Update broken assertions; add sort/pagination tests |
| `smoosense-py/tests/test_s3_ls.py` | Update broken assertions; add sort/pagination tests |
| `smoosense-gui/src/lib/features/folderTree/folderTreeSlice.ts` | `sortBy`/`sortOrder` state; `childrenTotal` on `TreeNode`; append mode in reducer |
| `smoosense-gui/src/components/folder-browser/FolderNavigation.tsx` | Add sort-by and sort-order controls |
| `smoosense-gui/src/components/folder-browser/FolderTreeView.tsx` | Inject "load more" pseudo-node; reload on sort change |
| `smoosense-gui/src/components/folder-browser/TreeNodeComponent.tsx` | Render "load more" button row |

---

## Task 1: Backend types — `models.py`

**Files:**
- Modify: `smoosense-py/smoosense/utils/models.py`

- [ ] **Step 1: Add `SortBy`, `SortOrder`, and `FSListResponse` to models**

Replace the entire file:

```python
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


SortBy = Literal["name", "size", "modified"]
SortOrder = Literal["asc", "desc"]


class FSListResponse(ImmutableBaseModel):
    items: list[FSItem]
    total: int
    offset: int
    limit: int
```

- [ ] **Step 2: Verify mypy passes**

```bash
cd smoosense-py && uv run mypy smoosense/utils/models.py
```
Expected: `Success: no issues found in 1 source file`

- [ ] **Step 3: Commit**

```bash
cd smoosense-py
git add smoosense/utils/models.py
git commit -m "feat: add FSListResponse and sort types to models"
```

---

## Task 2: Backend — `local_fs.py`

**Files:**
- Modify: `smoosense-py/smoosense/utils/local_fs.py`

- [ ] **Step 1: Update `list_one_level` to collect all items, sort, then paginate**

Replace the entire file:

```python
import logging
import os

from pydantic import validate_call

from smoosense.utils.models import FSItem, SortBy, SortOrder

logger = logging.getLogger(__name__)


class LocalFileSystem:
    @staticmethod
    @validate_call
    def list_one_level(
        path: str,
        limit: int = 50,
        offset: int = 0,
        sort_by: SortBy = "name",
        sort_order: SortOrder = "asc",
        show_hidden: bool = False,
    ) -> tuple[list[FSItem], int]:
        if path.startswith("~"):
            path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path {path} does not exist")

        all_items: list[FSItem] = []
        for entry in os.scandir(path):
            if entry.name.startswith(".") and not show_hidden:
                continue
            all_items.append(
                FSItem(
                    name=entry.name,
                    size=entry.stat().st_size,
                    lastModified=int(1000 * entry.stat().st_mtime),
                    isDir=entry.is_dir(),
                )
            )

        reverse = sort_order == "desc"
        if sort_by == "size":
            all_items.sort(key=lambda x: x.size, reverse=reverse)
        elif sort_by == "modified":
            all_items.sort(key=lambda x: x.lastModified, reverse=reverse)
        else:
            all_items.sort(key=lambda x: x.name.lower(), reverse=reverse)

        total = len(all_items)
        return all_items[offset : offset + limit], total
```

- [ ] **Step 2: Verify mypy**

```bash
cd smoosense-py && uv run mypy smoosense/utils/local_fs.py
```
Expected: `Success: no issues found in 1 source file`

- [ ] **Step 3: Commit**

```bash
cd smoosense-py
git add smoosense/utils/local_fs.py
git commit -m "feat: add sort and pagination to LocalFileSystem.list_one_level"
```

---

## Task 3: Backend — `s3_fs.py`

**Files:**
- Modify: `smoosense-py/smoosense/utils/s3_fs.py`

- [ ] **Step 1: Update `list_one_level` to fetch all items then sort+paginate**

Replace only the `list_one_level` method (lines 19–70) in `s3_fs.py`:

```python
    @validate_call()
    def list_one_level(
        self,
        key: str,
        limit: int = 50,
        offset: int = 0,
        sort_by: SortBy = "name",
        sort_order: SortOrder = "asc",
    ) -> tuple[list[FSItem], int]:
        from botocore.exceptions import ClientError

        parsed = urlparse(key)
        bucket = parsed.netloc
        prefix = parsed.path.lstrip("/")
        if prefix:
            prefix = prefix.rstrip("/") + "/"

        paginator = self.s3_client.get_paginator("list_objects_v2")
        all_items: list[FSItem] = []

        try:
            for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
                for prefix_entry in page.get("CommonPrefixes", []):
                    all_items.append(
                        FSItem(
                            name=os.path.basename(prefix_entry["Prefix"].rstrip("/")),
                            size=0,
                            lastModified=0,
                            isDir=True,
                        )
                    )
                for obj in page.get("Contents", []):
                    if obj["Key"] == prefix:
                        continue
                    all_items.append(
                        FSItem(
                            name=os.path.basename(obj["Key"]),
                            size=obj["Size"],
                            lastModified=int(obj["LastModified"].timestamp() * 1000),
                            isDir=False,
                        )
                    )
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "AccessDenied":
                raise AccessDeniedException(str(e)) from e
            if error_code == "NoSuchBucket":
                raise FileNotFoundError(str(e)) from e
            raise

        reverse = sort_order == "desc"
        if sort_by == "size":
            all_items.sort(key=lambda x: x.size, reverse=reverse)
        elif sort_by == "modified":
            all_items.sort(key=lambda x: x.lastModified, reverse=reverse)
        else:
            all_items.sort(key=lambda x: x.name.lower(), reverse=reverse)

        total = len(all_items)
        return all_items[offset : offset + limit], total
```

Also add `SortBy, SortOrder` to the import at the top:
```python
from smoosense.utils.models import FSItem, SortBy, SortOrder
```

- [ ] **Step 2: Verify mypy**

```bash
cd smoosense-py && uv run mypy smoosense/utils/s3_fs.py
```
Expected: `Success: no issues found in 1 source file`

- [ ] **Step 3: Commit**

```bash
cd smoosense-py
git add smoosense/utils/s3_fs.py
git commit -m "feat: add sort and pagination to S3FileSystem.list_one_level"
```

---

## Task 4: Backend — `handlers/fs.py`

**Files:**
- Modify: `smoosense-py/smoosense/handlers/fs.py`

- [ ] **Step 1: Update `/ls` handler to accept new params and return `FSListResponse`**

Replace the `get_ls` function (lines 36–47):

```python
@fs_bp.get("/ls")
@requires_auth_api
@handle_api_errors
def get_ls() -> Response:
    path = require_arg("path")
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    sort_by = request.args.get("sort_by", "name")
    sort_order = request.args.get("sort_order", "asc")
    show_hidden = request.args.get("show_hidden", "false").lower() == "true"

    if path.startswith("s3://"):
        s3_client = current_app.config["S3_CLIENT"]
        items, total = S3FileSystem(s3_client).list_one_level(path, limit, offset, sort_by, sort_order)
    else:
        items, total = LocalFileSystem.list_one_level(path, limit, offset, sort_by, sort_order, show_hidden)

    result = FSListResponse(items=items, total=total, offset=offset, limit=limit)
    return jsonify(result.model_dump())
```

Also add `FSListResponse` to the import at the top of `fs.py`:
```python
from smoosense.utils.models import FSListResponse
```

- [ ] **Step 2: Verify mypy**

```bash
cd smoosense-py && uv run mypy smoosense/handlers/fs.py
```
Expected: `Success: no issues found in 1 source file`

- [ ] **Step 3: Commit**

```bash
cd smoosense-py
git add smoosense/handlers/fs.py
git commit -m "feat: update /api/ls to support sort and pagination"
```

---

## Task 5: Backend tests

**Files:**
- Modify: `smoosense-py/tests/test_fs_ls.py`
- Modify: `smoosense-py/tests/test_s3_ls.py`

- [ ] **Step 1: Update `test_fs_ls.py` — fix broken assertions and add new tests**

Replace the entire file:

```python
import json
import os
import tempfile
import unittest

from smoosense.my_logging import getLogger
from tests.base_fs_test import BaseFSTest

logger = getLogger(__name__)


class TestLSEndpoint(BaseFSTest):
    """Test cases for the /ls endpoint."""

    def setUp(self):
        super().setUp()
        # Add extra files with known sizes and names for sort testing
        for name, size in [("alpha.txt", 100), ("beta.txt", 300), ("gamma.txt", 200)]:
            path = os.path.join(self.temp_dir, name)
            with open(path, "wb") as f:
                f.write(b"x" * size)

    def _ls(self, **kwargs):
        """Helper: call /ls with given params, return parsed JSON."""
        params = {"path": self.temp_dir, **kwargs}
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        response = self.client.get(f"/ls?{qs}")
        self.assertEqual(response.status_code, 200)
        return json.loads(response.get_data(as_text=True))

    def test_response_shape(self):
        """Response is an object with items/total/offset/limit."""
        data = self._ls()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("offset", data)
        self.assertIn("limit", data)
        self.assertIsInstance(data["items"], list)

    def test_items_present(self):
        """Expected files and directories appear in items."""
        data = self._ls()
        names = [item["name"] for item in data["items"]]
        self.assertIn("test_file.txt", names)
        self.assertIn("test_dir", names)

    def test_sort_by_name_asc(self):
        """Items are returned in alphabetical order by default."""
        data = self._ls(sort_by="name", sort_order="asc")
        file_names = [i["name"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(file_names, sorted(file_names, key=str.lower))

    def test_sort_by_name_desc(self):
        """Items are returned in reverse alphabetical order."""
        data = self._ls(sort_by="name", sort_order="desc")
        file_names = [i["name"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(file_names, sorted(file_names, key=str.lower, reverse=True))

    def test_sort_by_size(self):
        """Items sorted by size ascending."""
        data = self._ls(sort_by="size", sort_order="asc")
        sizes = [i["size"] for i in data["items"] if not i["isDir"]]
        self.assertEqual(sizes, sorted(sizes))

    def test_pagination_offset(self):
        """Offset skips the first N items."""
        all_data = self._ls(sort_by="name", sort_order="asc")
        page2_data = self._ls(sort_by="name", sort_order="asc", offset=1, limit=2)
        self.assertEqual(
            [i["name"] for i in page2_data["items"]],
            [i["name"] for i in all_data["items"][1:3]],
        )

    def test_total_is_stable_across_pages(self):
        """Total count is the same regardless of offset."""
        page1 = self._ls(limit=1, offset=0)
        page2 = self._ls(limit=1, offset=1)
        self.assertEqual(page1["total"], page2["total"])

    def test_access_denied(self):
        import shutil
        restricted_dir = "/tmp/dummy-test"
        if os.path.exists(restricted_dir):
            shutil.rmtree(restricted_dir)
        os.makedirs(restricted_dir, exist_ok=True)
        with open(os.path.join(restricted_dir, "test.txt"), "w") as f:
            f.write("x")
        try:
            os.chmod(restricted_dir, 0o000)
            response = self.client.get(f"/ls?path={restricted_dir}")
            self.assertEqual(response.status_code, 403)
            data = json.loads(response.get_data(as_text=True))
            self.assertIn("error", data)
        finally:
            os.chmod(restricted_dir, 0o755)
            shutil.rmtree(restricted_dir, ignore_errors=True)

    def test_not_found(self):
        nonexistent = "/tmp/this-does-not-exist-12345"
        if os.path.exists(nonexistent):
            import shutil
            shutil.rmtree(nonexistent)
        response = self.client.get(f"/ls?path={nonexistent}")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run local FS tests**

```bash
cd smoosense-py && uv run pytest tests/test_fs_ls.py -v
```
Expected: All tests pass.

- [ ] **Step 3: Update `test_s3_ls.py` — fix broken assertions**

Replace the `test_ls_s3_bucket_root` and `test_ls_s3_nested_path` and `test_ls_s3_with_limit` methods and add sort/pagination tests. Replace the entire file:

```python
import json
import unittest

import boto3
from flask import Flask

from smoosense.handlers.fs import fs_bp
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class TestS3LSEndpoint(unittest.TestCase):
    """Test cases for the /ls endpoint with S3 paths."""

    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(fs_bp)
        self.app.config["TESTING"] = True
        self.app.config["S3_CLIENT"] = boto3.client("s3")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def _ls(self, path="s3://smoosense-demo/", **kwargs):
        params = {"path": path, **kwargs}
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        response = self.client.get(f"/ls?{qs}")
        return response, json.loads(response.get_data(as_text=True))

    def test_response_shape(self):
        """Response has items/total/offset/limit fields."""
        response, data = self._ls()
        self.assertEqual(response.status_code, 200)
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("offset", data)
        self.assertIn("limit", data)
        self.assertGreater(len(data["items"]), 0)

    def test_item_fields(self):
        """Each item has required fields."""
        response, data = self._ls()
        self.assertEqual(response.status_code, 200)
        for item in data["items"]:
            self.assertIn("name", item)
            self.assertIn("size", item)
            self.assertIn("lastModified", item)
            self.assertIn("isDir", item)

    def test_nested_path(self):
        response, data = self._ls(path="s3://smoosense-demo/datasets/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(data["items"], list)

    def test_with_limit(self):
        response, data = self._ls(limit=2)
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(data["items"]), 2)

    def test_sort_by_name_asc(self):
        response, data = self._ls(sort_by="name", sort_order="asc")
        self.assertEqual(response.status_code, 200)
        names = [i["name"] for i in data["items"]]
        self.assertEqual(names, sorted(names, key=str.lower))

    def test_pagination_total_stable(self):
        _, page1 = self._ls(limit=1, offset=0)
        _, page2 = self._ls(limit=1, offset=1)
        self.assertEqual(page1["total"], page2["total"])

    def test_nonexistent_bucket(self):
        response, data = self._ls(path="s3://this-bucket-definitely-does-not-exist-12345/")
        self.assertEqual(response.status_code, 404)
        self.assertIn("error", data)

    def test_missing_path(self):
        response = self.client.get("/ls")
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 4: Run all backend tests**

```bash
cd smoosense-py && uv run pytest tests/test_fs_ls.py tests/test_s3_ls.py -v
```
Expected: All local FS tests pass. S3 tests pass if AWS credentials are configured.

- [ ] **Step 5: Commit**

```bash
cd smoosense-py
git add tests/test_fs_ls.py tests/test_s3_ls.py
git commit -m "test: update fs ls tests for pagination/sort response format"
```

---

## Task 6: Frontend Redux — `folderTreeSlice.ts`

**Files:**
- Modify: `smoosense-gui/src/lib/features/folderTree/folderTreeSlice.ts`

- [ ] **Step 1: Replace the entire file with the updated slice**

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {pathJoin, pathBasename, pathParent} from '@/lib/utils/pathUtils'
import { API_PREFIX } from '@/lib/utils/urlUtils'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { setTablePath } from '@/lib/features/ui/uiSlice'
import type { AppDispatch, RootState } from '@/lib/store'

export interface FSItem {
  name: string
  size: number
  lastModified: number
  isDir: boolean
}

export type SortBy = 'name' | 'size' | 'modified'
export type SortOrder = 'asc' | 'desc'

export interface TreeNode {
  id: string
  name: string
  path: string
  isDir: boolean
  size: number
  lastModified: number
  children?: TreeNode[]
  childrenTotal: number   // 0 = unknown/not loaded yet
  isLoaded: boolean
  isExpanded: boolean
  loading: boolean
}

interface FolderTreeState {
  rootNode: TreeNode | null
  expandedPaths: string[]
  loading: boolean
  error: string | null
  viewingId: string | null
  sortBy: SortBy
  sortOrder: SortOrder
}

const initialState: FolderTreeState = {
  rootNode: null,
  expandedPaths: [],
  loading: false,
  error: null,
  viewingId: null,
  sortBy: 'name',
  sortOrder: 'asc',
}

interface FSListResponse {
  items: FSItem[]
  total: number
  offset: number
  limit: number
}

export const loadFolderContents = createAsyncThunk(
  'folderTree/loadFolderContents',
  async ({ path, offset = 0, limit = 50, showHidden = false, append = false }: {
    path: string
    offset?: number
    limit?: number
    showHidden?: boolean
    append?: boolean
  }, { getState }) => {
    const state = getState() as RootState
    const { sortBy, sortOrder } = state.folderTree

    const params = new URLSearchParams({
      path,
      limit: limit.toString(),
      offset: offset.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
      show_hidden: showHidden.toString(),
    })

    const response = await fetch(`${API_PREFIX}/ls?${params}`)
    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to load folder contents: ${response.statusText}`)
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== `Failed to load folder contents: ${response.statusText}`) {
          throw parseError
        }
        throw new Error(`Failed to load folder contents: ${response.statusText}`)
      }
    }

    const data: FSListResponse = await response.json()
    return { path, items: data.items, total: data.total, offset: data.offset, append }
  }
)

function createTreeNode(item: FSItem, parentPath: string): TreeNode {
  const fullPath = (item.name === parentPath || parentPath === '') ? item.name : pathJoin(parentPath, item.name)
  return {
    id: fullPath,
    name: pathBasename(fullPath) || item.name,
    path: fullPath,
    isDir: item.isDir,
    size: item.size,
    lastModified: item.lastModified,
    children: item.isDir ? [] : undefined,
    childrenTotal: 0,
    isLoaded: false,
    isExpanded: false,
    loading: false,
  }
}

function updateNodeInTree(node: TreeNode, targetPath: string, updater: (node: TreeNode) => TreeNode): TreeNode {
  if (node.path === targetPath) {
    return updater(node)
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeInTree(child, targetPath, updater))
    }
  }
  return node
}

export const folderTreeSlice = createSlice({
  name: 'folderTree',
  initialState,
  reducers: {
    toggleNodeExpansion: (state, action: PayloadAction<string>) => {
      const path = action.payload
      const pathIndex = state.expandedPaths.indexOf(path)
      if (pathIndex >= 0) {
        state.expandedPaths.splice(pathIndex, 1)
      } else {
        state.expandedPaths.push(path)
      }
      if (state.rootNode) {
        state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
          ...node,
          isExpanded: !node.isExpanded
        }))
      }
    },
    expandNode: (state, action: PayloadAction<string>) => {
      const path = action.payload
      if (!state.expandedPaths.includes(path)) {
        state.expandedPaths.push(path)
      }
      if (state.rootNode) {
        state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
          ...node,
          isExpanded: true
        }))
      }
    },
    clearTree: (state) => {
      state.rootNode = null
      state.expandedPaths = []
      state.error = null
    },
    setViewingId: (state, action: PayloadAction<string | null>) => {
      state.viewingId = action.payload
    },
    setNodeLoading: (state, action: PayloadAction<{ path: string; loading: boolean }>) => {
      const { path, loading } = action.payload
      if (state.rootNode) {
        state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({ ...node, loading }))
      }
    },
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload
      // Clear tree so FolderTreeView's useEffect will reload with new sort
      state.rootNode = null
      state.expandedPaths = []
      state.error = null
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload
      state.rootNode = null
      state.expandedPaths = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFolderContents.pending, (state, action) => {
        state.loading = true
        state.error = null
        const path = action.meta.arg.path
        if (state.rootNode) {
          state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({ ...node, loading: true }))
        }
      })
      .addCase(loadFolderContents.fulfilled, (state, action) => {
        state.loading = false
        const { path, items, total, append } = action.payload

        if (!state.rootNode) {
          const rootItem: FSItem = {
            name: pathBasename(path),
            size: 0,
            lastModified: Date.now(),
            isDir: true,
          }
          state.rootNode = createTreeNode(rootItem, pathParent(path))
          state.rootNode.path = path
          state.rootNode.isLoaded = true
          state.rootNode.isExpanded = true
          state.rootNode.childrenTotal = total
          state.rootNode.children = items.map(item => createTreeNode(item, path))
        } else {
          state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
            ...node,
            children: append
              ? [...(node.children ?? []), ...items.map(item => createTreeNode(item, path))]
              : items.map(item => createTreeNode(item, path)),
            childrenTotal: total,
            isLoaded: true,
            loading: false,
          }))
        }
      })
      .addCase(loadFolderContents.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load folder contents'
        const path = action.meta.arg.path
        if (state.rootNode) {
          state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({ ...node, loading: false }))
        }
      })
  },
})

export const {
  toggleNodeExpansion,
  expandNode,
  clearTree,
  setNodeLoading,
  setSortBy,
  setSortOrder,
} = folderTreeSlice.actions

const { setViewingId: setViewingIdAction } = folderTreeSlice.actions

export const setViewingId = (id: string | null) => (dispatch: AppDispatch) => {
  dispatch(setViewingIdAction(id))
  if (id) {
    const fileType = getFileType(id)
    if (fileType === FileType.ColumnarTable || fileType === FileType.RowTable) {
      dispatch(setTablePath(id))
    }
  }
}

export default folderTreeSlice.reducer
```

- [ ] **Step 2: Typecheck**

```bash
cd smoosense-gui && pnpm typecheck
```
Expected: No errors in `folderTreeSlice.ts`.

- [ ] **Step 3: Commit**

```bash
cd smoosense-gui
git add src/lib/features/folderTree/folderTreeSlice.ts
git commit -m "feat: add sortBy/sortOrder state and pagination to folderTreeSlice"
```

---

## Task 7: Frontend UI — Sort controls and "Load more" button

**Files:**
- Modify: `smoosense-gui/src/components/folder-browser/FolderNavigation.tsx`
- Modify: `smoosense-gui/src/components/folder-browser/FolderTreeView.tsx`
- Modify: `smoosense-gui/src/components/folder-browser/TreeNodeComponent.tsx`

- [ ] **Step 1: Add sort controls to `FolderNavigation.tsx`**

Replace the imports and the `<Select>` block inside the header div. The new header area should have two dropdowns: one for file info display (existing) and one for sort. Replace the entire file:

```tsx
'use client'

import { FolderOpen, ChevronRight, MoreHorizontal } from 'lucide-react'
import FolderTreeView from './FolderTreeView'
import FolderHelpCard from './FolderHelpCard'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setFileInfoToShow } from '@/lib/features/ui/uiSlice'
import { setSortBy, setSortOrder, type SortBy, type SortOrder } from '@/lib/features/folderTree/folderTreeSlice'
import { pathParent, pathBasename } from '@/lib/utils/pathUtils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function FolderNavigation() {
  const dispatch = useAppDispatch()
  const fileInfoToShow = useAppSelector(state => state.ui.fileInfoToShow)
  const sortBy = useAppSelector(state => state.folderTree.sortBy)
  const sortOrder = useAppSelector(state => state.folderTree.sortOrder)
  const rootFolder = useAppSelector(state => state.ui.rootFolder)

  const createBreadcrumbItems = (path: string) => {
    if (!path) return []
    const items = []
    const parent = pathParent(path)
    const grandparent = pathParent(parent)
    const needsEllipsis = grandparent && grandparent !== parent && pathParent(grandparent) !== grandparent
    if (needsEllipsis) {
      items.push({ name: '...', path: '', isEllipsis: true })
    }
    if (grandparent && grandparent !== parent) {
      items.push({ name: pathBasename(grandparent) || grandparent, path: grandparent, isEllipsis: false })
    }
    if (parent && parent !== path) {
      items.push({ name: pathBasename(parent) || parent, path: parent, isEllipsis: false })
    }
    return items
  }

  const breadcrumbItems = createBreadcrumbItems(rootFolder || '~')

  const handleBreadcrumbClick = (path: string) => {
    window.open(`./FolderBrowser?rootFolder=${encodeURIComponent(path)}`, '_blank')
  }

  return (
    <div className="h-full w-full border-r bg-muted/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-sm">Folder Navigation</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort field */}
          <Select
            value={sortBy}
            onValueChange={(value: SortBy) => dispatch(setSortBy(value))}
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="size">Sort: Size</SelectItem>
              <SelectItem value="modified">Sort: Modified</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort direction */}
          <Select
            value={sortOrder}
            onValueChange={(value: SortOrder) => dispatch(setSortOrder(value))}
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">↑ Asc</SelectItem>
              <SelectItem value="desc">↓ Desc</SelectItem>
            </SelectContent>
          </Select>

          {/* File info display */}
          <Select
            value={fileInfoToShow}
            onValueChange={(value: 'size' | 'lastModified' | 'lastModifiedRelative') =>
              dispatch(setFileInfoToShow(value))
            }
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="lastModified">Modified Date</SelectItem>
              <SelectItem value="lastModifiedRelative">Modified (Relative)</SelectItem>
            </SelectContent>
          </Select>

          <FolderHelpCard />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <nav className="flex items-center space-x-1 text-xs overflow-hidden">
          {breadcrumbItems.map((item, index) => (
            <div key={item.path} className="flex items-center space-x-1 min-w-0">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              {item.isEllipsis ? (
                <div className="flex items-center px-1 py-0.5 text-muted-foreground">
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(item.path)}
                  className="flex items-center space-x-1 px-1 py-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors min-w-0 cursor-pointer"
                  title={item.path}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        <FolderTreeView />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `ArboristNodeData` in `TreeNodeComponent.tsx` to support "load more" nodes**

Add `isLoadMore`, `parentPath`, and `loadedCount` optional fields to the `ArboristNodeData` interface and add a render branch. Replace only the `ArboristNodeData` interface and `TreeNodeComponent` default export in the file:

At the top, replace the `ArboristNodeData` interface:
```typescript
export interface ArboristNodeData {
  id: string
  name: string
  path: string
  isDir: boolean
  size: number
  lastModified: number
  isLoaded: boolean
  loading: boolean
  isExpanded: boolean
  children?: ArboristNodeData[]
  isLoadMore?: boolean
  parentPath?: string
  loadedCount?: number
}
```

Add this import at the top of the file (alongside existing imports):
```typescript
import { loadFolderContents } from '@/lib/features/folderTree/folderTreeSlice'
```
(It's already imported — no change needed here since it was already imported.)

Just before the closing of `TreeNodeComponent`, add a "load more" early-return branch. Insert this block right after the `const nodeData = node.data` and `const isViewing = ...` lines:

```typescript
  // Render "load more" button for pseudo-nodes
  if (nodeData.isLoadMore) {
    return (
      <div
        style={style}
        className="flex items-center px-2 py-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/30 rounded"
        onClick={(e) => {
          e.stopPropagation()
          dispatch(loadFolderContents({
            path: nodeData.parentPath!,
            offset: nodeData.loadedCount!,
            append: true,
          }))
        }}
      >
        <span className="ml-8">{nodeData.name}</span>
      </div>
    )
  }
```

- [ ] **Step 3: Update `FolderTreeView.tsx` to inject "load more" nodes and reload on sort change**

Replace the entire file:

```tsx
'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tree } from 'react-arborist'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import {
  loadFolderContents,
  toggleNodeExpansion,
  clearTree,
  type TreeNode
} from '@/lib/features/folderTree/folderTreeSlice'
import TreeNodeComponent, { type ArboristNodeData } from './TreeNodeComponent'

export default function FolderTreeView() {
  const dispatch = useAppDispatch()
  const { rootNode, loading, error, sortBy, sortOrder } = useAppSelector(state => state.folderTree)
  const rootFolder = useAppSelector(state => state.ui.rootFolder)
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(600)

  // Reload when rootFolder or sort settings change
  useEffect(() => {
    const viewing = searchParams.get('viewing')
    if (rootFolder) {
      dispatch(clearTree())
      if (!viewing || viewing.trim() === '') {
        dispatch(loadFolderContents({ path: rootFolder }))
      }
    } else {
      dispatch(clearTree())
    }
  }, [rootFolder, sortBy, sortOrder, searchParams, dispatch])

  // Expand root node when first loaded
  useEffect(() => {
    if (rootNode && !rootNode.isExpanded) {
      dispatch(toggleNodeExpansion(rootNode.path))
    }
  }, [rootNode, dispatch])

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.height > 0) setHeight(Math.floor(rect.height))
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [rootNode])

  const convertToArboristData = (node: TreeNode): ArboristNodeData => {
    let children: ArboristNodeData[] | undefined = node.children
      ? node.children.map(convertToArboristData)
      : undefined

    // Inject "load more" pseudo-node when the folder is loaded but has more items
    if (children && node.isLoaded && node.childrenTotal > children.length) {
      const remaining = node.childrenTotal - children.length
      children = [
        ...children,
        {
          id: `${node.path}/__load_more__`,
          name: `Load ${remaining} more…`,
          path: `${node.path}/__load_more__`,
          isDir: false,
          size: 0,
          lastModified: 0,
          isLoaded: false,
          loading: false,
          isExpanded: false,
          isLoadMore: true,
          parentPath: node.path,
          loadedCount: children.length,
        },
      ]
    }

    return {
      id: node.id,
      name: node.name,
      path: node.path,
      isDir: node.isDir,
      size: node.size,
      lastModified: node.lastModified,
      isLoaded: node.isLoaded,
      loading: node.loading,
      isExpanded: node.isExpanded,
      children,
    }
  }

  const treeData = rootNode ? [convertToArboristData(rootNode)] : []

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        <p>Error loading folder tree:</p>
        <p className="mt-1">{error}</p>
      </div>
    )
  }

  if (!rootNode && loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span>Loading folder tree...</span>
        </div>
      </div>
    )
  }

  if (!rootNode) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No folder selected
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <Tree
        data={treeData}
        openByDefault={false}
        width="100%"
        height={height}
        indent={20}
        rowHeight={32}
        overscanCount={10}
        disableDrag
        disableDrop
        disableMultiSelection
        childrenAccessor="children"
        idAccessor="id"
      >
        {TreeNodeComponent}
      </Tree>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck the frontend**

```bash
cd smoosense-gui && pnpm typecheck
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd smoosense-gui
git add src/components/folder-browser/FolderNavigation.tsx \
        src/components/folder-browser/FolderTreeView.tsx \
        src/components/folder-browser/TreeNodeComponent.tsx
git commit -m "feat: add sort controls and load-more pagination to folder browser"
```

---

## Spec Coverage Check

| Requirement | Covered by |
|------------|------------|
| Pagination (offset-based) | Tasks 2–4 (backend), Task 6 (Redux), Task 7 (UI) |
| Ordering by name | Tasks 2–4 (backend), Task 7 (sort controls) |
| Ordering by size | Tasks 2–4 (backend), Task 7 (sort controls) |
| Ordering by modified date | Tasks 2–4 (backend), Task 7 (sort controls) |
| Local filesystem support | Tasks 2, 4, 5, 6 |
| S3 support | Tasks 3, 4, 5, 6 |
| "Load more" UI | Task 7 (FolderTreeView + TreeNodeComponent) |
| Sort direction (asc/desc) | Tasks 2–4 (backend), Task 7 (sort controls) |
