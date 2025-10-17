import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {pathJoin, pathBasename, pathParent} from '@/lib/utils/pathUtils'
import { API_PREFIX } from '@/lib/utils/urlUtils'

export interface FSItem {
  name: string
  size: number
  lastModified: number
  isDir: boolean
}

export interface TreeNode {
  id: string
  name: string
  path: string
  isDir: boolean
  size: number
  lastModified: number
  children?: TreeNode[]
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
}

const initialState: FolderTreeState = {
  rootNode: null,
  expandedPaths: [],
  loading: false,
  error: null,
  viewingId: null,
}

// Async thunk to load folder contents
export const loadFolderContents = createAsyncThunk(
  'folderTree/loadFolderContents',
  async ({ path, limit = 100, showHidden = false }: { 
    path: string
    limit?: number
    showHidden?: boolean 
  }) => {
    const params = new URLSearchParams({
      path,
      limit: limit.toString(),
      show_hidden: showHidden.toString(),
    })
    
    const response = await fetch(`${API_PREFIX}/ls?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to load folder contents: ${response.statusText}`)
    }
    
    const items: FSItem[] = await response.json()
    return { path, items }
  }
)

// Helper function to create a TreeNode from FSItem
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
    isLoaded: false,
    isExpanded: false,
    loading: false,
  }
}

// Helper function to find and update a node in the tree
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
    clearTree: (state) => {
      state.rootNode = null
      state.expandedPaths = []
      state.error = null
      state.viewingId = null
    },
    setViewingId: (state, action: PayloadAction<string | null>) => {
      state.viewingId = action.payload
    },
    setNodeLoading: (state, action: PayloadAction<{ path: string; loading: boolean }>) => {
      const { path, loading } = action.payload
      if (state.rootNode) {
        state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
          ...node,
          loading
        }))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFolderContents.pending, (state, action) => {
        state.loading = true
        state.error = null
        const path = action.meta.arg.path
        // Set the specific node as loading
        if (state.rootNode) {
          state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
            ...node,
            loading: true
          }))
        }
      })
      .addCase(loadFolderContents.fulfilled, (state, action) => {
        state.loading = false
        const { path, items } = action.payload

        if (!state.rootNode) {
          // Creating root node for the first time
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
          state.rootNode.children = items.map(item => createTreeNode(item, path))
        } else {
          // Update existing node's children
          const updatedRootNode = updateNodeInTree(state.rootNode, path, (node) => ({
            ...node,
            children: items.map(item => createTreeNode(item, path)),
            isLoaded: true,
            loading: false,
            isExpanded: true,
          }))
          state.rootNode = updatedRootNode
        }
      })
      .addCase(loadFolderContents.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load folder contents'
        const path = action.meta.arg.path
        // Clear the specific node's loading state
        if (state.rootNode) {
          state.rootNode = updateNodeInTree(state.rootNode, path, (node) => ({
            ...node,
            loading: false
          }))
        }
      })
  },
})

export const { toggleNodeExpansion, clearTree, setViewingId, setNodeLoading } = folderTreeSlice.actions
export default folderTreeSlice.reducer