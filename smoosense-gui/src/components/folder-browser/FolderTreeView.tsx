'use client'

import { useEffect } from 'react'
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
  const { rootNode, loading, error } = useAppSelector(state => state.folderTree)
  const rootFolder = useAppSelector(state => state.ui.rootFolder)
  
  // Load folder contents when rootFolder changes
  useEffect(() => {
    if (rootFolder) {
      dispatch(clearTree())
      dispatch(loadFolderContents({ path: rootFolder }))
    } else {
      dispatch(clearTree())
    }
  }, [rootFolder, dispatch])

  // Expand root node when it's first loaded
  useEffect(() => {
    if (rootNode && !rootNode.isExpanded) {
      dispatch(toggleNodeExpansion(rootNode.path))
    }
  }, [rootNode, dispatch])
  
  // Convert tree structure to hierarchical format for react-arborist
  const convertToArboristData = (node: TreeNode): ArboristNodeData => {
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
      children: node.children ? node.children.map(convertToArboristData) : undefined
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
    <div className="h-full w-full">
      <Tree
        data={treeData}
        openByDefault={false}
        width="100%"
        height={800}
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