'use client'

import { useCallback, useEffect } from 'react'
import { NodeApi } from 'react-arborist'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { loadFolderContents, setViewingId, toggleNodeExpansion } from '@/lib/features/folderTree/folderTreeSlice'
import { cn } from '@/lib/utils'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { ICONS } from '@/lib/utils/iconUtils'
import { formatDate, formatRelativeTime } from '@/lib/utils/timeUtils'

export interface ArboristNodeData {
  id: string
  name: string
  path: string
  isDir: boolean
  size: number
  lastModified: number
  isBrokenSymlink: boolean
  symlinkTarget?: string
  isLoaded: boolean
  loading: boolean
  isExpanded: boolean
  children?: ArboristNodeData[]
  isLoadMore?: boolean
  parentPath?: string
  loadedCount?: number
}

interface TreeNodeComponentProps {
  node: NodeApi<ArboristNodeData>
  style: React.CSSProperties
  dragHandle?: (el: HTMLDivElement | null) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i]
}

export default function TreeNodeComponent({ node, style }: TreeNodeComponentProps) {
  const dispatch = useAppDispatch()
  const viewingId = useAppSelector(state => state.folderTree.viewingId)
  const fileInfoToShow = useAppSelector(state => state.ui.fileInfoToShow)
  const nodeData = node.data
  const isViewing = viewingId === nodeData.id

  // Sync react-arborist expansion state with Redux state
  useEffect(() => {
    if (nodeData.isDir && nodeData.isExpanded !== node.isOpen) {
      if (nodeData.isExpanded) {
        node.open()
      } else {
        node.close()
      }
    }
  }, [nodeData.isExpanded, nodeData.isDir, node])
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Set the viewing ID for both files and folders (also sets tablePath for table files)
    dispatch(setViewingId(nodeData.id))

    // If it's a directory and not loaded, load its contents (but don't expand)
    if (nodeData.isDir && !nodeData.isLoaded) {
      dispatch(loadFolderContents({ path: nodeData.path }))
    }
  }, [nodeData, dispatch])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    if (nodeData.isDir) {
      // For directories, toggle expand/collapse
      if (!nodeData.isLoaded) {
        dispatch(loadFolderContents({ path: nodeData.path }))
      }
      dispatch(toggleNodeExpansion(nodeData.path))
    } else {
      // For files, open table files in Table view
      const fileType = getFileType(nodeData.name)

      if (fileType === FileType.ColumnarTable || fileType === FileType.RowTable) {
        const url = `./Table?tablePath=${encodeURIComponent(nodeData.path)}`
        window.open(url, '_blank')
      }
    }
  }, [nodeData, dispatch])

  const handleOpenInNewTab = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // For .lance folders, open in Table view
    if (nodeData.name.endsWith('.lance')) {
      const url = `./Table?tablePath=${encodeURIComponent(nodeData.path)}`
      window.open(url, '_blank')
      return
    }

    // For other folders, open in FolderBrowser
    const url = `./FolderBrowser?rootFolder=${encodeURIComponent(nodeData.path)}`
    window.open(url, '_blank')
  }, [nodeData.path, nodeData.name])

  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Refresh children data by reloading folder contents
    dispatch(loadFolderContents({ path: nodeData.path }))
  }, [nodeData.path, dispatch])
  
  const renderIcon = () => {
    if (nodeData.isBrokenSymlink) {
      return ICONS.BROKEN_SYMLINK
    }

    if (nodeData.isDir) {
      return node.isOpen ? ICONS.FOLDER_OPEN : ICONS.FOLDER_CLOSED
    }
    
    const fileType = getFileType(nodeData.name)
    
    switch (fileType) {
      case FileType.Json:
        return ICONS.JSON
      case FileType.ColumnarTable:
        return ICONS.COLUMNAR_TABLE
      case FileType.RowTable:
        return ICONS.ROW_TABLE
      case FileType.Image:
        return ICONS.IMAGE
      case FileType.Video:
        return ICONS.VIDEO
      case FileType.Text:
        return ICONS.TEXT
      default:
        return ICONS.FILE_DEFAULT
    }
  }
  
  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // If expanding and not loaded yet, load children first
    if (!node.isOpen && !nodeData.isLoaded) {
      dispatch(loadFolderContents({ path: nodeData.path }))
    }

    // Toggle expansion state in Redux (will sync to react-arborist via useEffect)
    dispatch(toggleNodeExpansion(nodeData.path))
  }, [node.isOpen, nodeData.isLoaded, nodeData.path, dispatch])

  const renderExpandIcon = () => {
    if (!nodeData.isDir) return <div className="w-4 h-4" />

    if (nodeData.loading) {
      return (
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-2 h-2 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    return (
      <div onClick={handleExpandClick} className="cursor-pointer">
        {node.isOpen ? ICONS.CHEVRON_DOWN : ICONS.CHEVRON_RIGHT}
      </div>
    )
  }
  
  const renderFileInfo = () => {
    // Don't show info for directories
    if (nodeData.isDir) return null
    
    let content: string
    switch (fileInfoToShow) {
      case 'size':
        content = formatFileSize(nodeData.size)
        break
      case 'lastModified':
        content = formatDate(nodeData.lastModified)
        break
      case 'lastModifiedRelative':
        content = formatRelativeTime(nodeData.lastModified)
        break
      default:
        return null
    }
    
    return (
      <span className="text-xs text-muted-foreground ml-auto">
        {content}
      </span>
    )
  }
  
  // Render "load more" button for pseudo-nodes (after all hooks)
  if (nodeData.isLoadMore) {
    return (
      <div
        style={style}
        className="flex items-center px-2 py-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/30 rounded"
        onClick={(e) => {
          e.stopPropagation()
          if (nodeData.parentPath == null || nodeData.loadedCount == null) return
          dispatch(loadFolderContents({
            path: nodeData.parentPath,
            offset: nodeData.loadedCount,
            append: true,
          }))
        }}
      >
        <span className="ml-8">{nodeData.name}</span>
      </div>
    )
  }

  return (
    <div
      style={style}
      className={cn(
        "group flex items-center space-x-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded relative",
        "select-none",
        isViewing && "bg-primary/20 hover:bg-primary/10 font-bold"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderExpandIcon()}
      {renderIcon()}
      <span
        className={cn(
          "truncate flex-1",
          nodeData.isBrokenSymlink && "text-red-500",
          nodeData.symlinkTarget && !nodeData.isBrokenSymlink && "text-blue-500",
        )}
        title={nodeData.symlinkTarget
          ? `${nodeData.name} (→ ${nodeData.symlinkTarget})${nodeData.isBrokenSymlink ? ' (broken symlink)' : ''}`
          : nodeData.name}
      >
        {nodeData.symlinkTarget
          ? `${nodeData.name} (→ ${nodeData.symlinkTarget})`
          : nodeData.name}
      </span>
      
      {/* File info display */}
      {renderFileInfo()}
      
      {/* Floating buttons for folders */}
      {nodeData.isDir && (
        <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={handleRefresh}
            className={cn(
              "bg-background border border-border rounded p-1 shadow-sm hover:bg-muted cursor-pointer",
              "flex items-center justify-center",
              nodeData.loading && "animate-spin"
            )}
            title={`Refresh ${nodeData.name}`}
            disabled={nodeData.loading}
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className={cn(
              "bg-background border border-border rounded p-1 shadow-sm hover:bg-muted cursor-pointer",
              "flex items-center justify-center"
            )}
            title={`Open ${nodeData.name} in new tab`}
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}