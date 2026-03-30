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
  const { rootNode, loading, error, sortBy, sortOrder, pageSize } = useAppSelector(state => state.folderTree)
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
  }, [rootFolder, sortBy, sortOrder, pageSize, searchParams, dispatch])

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
      children = [
        ...children,
        {
          id: `${node.path}/__load_more__`,
          name: `Load ${pageSize} more…`,
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
