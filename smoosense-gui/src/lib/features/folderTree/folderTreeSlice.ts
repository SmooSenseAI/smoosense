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
  filterPattern: string
}

const initialState: FolderTreeState = {
  rootNode: null,
  expandedPaths: [],
  loading: false,
  error: null,
  viewingId: null,
  sortBy: 'name',
  sortOrder: 'asc',
  filterPattern: '',
}

interface FSListResponse {
  items: FSItem[]
  total: number
  offset: number
  limit: number
}

export const loadFolderContents = createAsyncThunk(
  'folderTree/loadFolderContents',
  async ({ path, offset = 0, limit = 10, showHidden = false, append = false }: {
    path: string
    offset?: number
    limit?: number
    showHidden?: boolean
    append?: boolean
  }, { getState }) => {
    const state = getState() as RootState
    const { sortBy, sortOrder, filterPattern } = state.folderTree

    const params = new URLSearchParams({
      path,
      limit: limit.toString(),
      offset: offset.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
      show_hidden: showHidden.toString(),
      ...(filterPattern ? { pattern: filterPattern } : {}),
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
    setFilterPattern: (state, action: PayloadAction<string>) => {
      if (state.filterPattern === action.payload) return
      state.filterPattern = action.payload
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
  setFilterPattern,
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
