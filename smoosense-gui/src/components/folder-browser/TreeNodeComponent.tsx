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
  isLoaded: boolean
  loading: boolean
  isExpanded: boolean
  children?: ArboristNodeData[]
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
  
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Set the viewing ID for both files and folders
    dispatch(setViewingId(nodeData.id))
    
    if (nodeData.isDir) {
      if (!nodeData.isLoaded) {
        // Load children first - expansion will happen automatically when loaded
        dispatch(loadFolderContents({ path: nodeData.path }))
      } else {
        // Children are already loaded, toggle expansion state in Redux
        dispatch(toggleNodeExpansion(nodeData.path))
      }
    }
  }, [nodeData, dispatch])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Only handle double-click for files (not directories)
    if (!nodeData.isDir) {
      const fileType = getFileType(nodeData.name)
      
      // Open table files in Table view
      if (fileType === FileType.ColumnarTable || fileType === FileType.RowTable) {
        const url = `./Table?tablePath=${encodeURIComponent(nodeData.path)}`
        window.open(url, '_blank')
      }
    }
  }, [nodeData])

  const handleOpenInNewTab = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const url = `./FolderBrowser?rootFolder=${encodeURIComponent(nodeData.path)}`
    window.open(url, '_blank')
  }, [nodeData.path])

  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Refresh children data by reloading folder contents
    dispatch(loadFolderContents({ path: nodeData.path }))
  }, [nodeData.path, dispatch])
  
  const renderIcon = () => {
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
  
  const renderExpandIcon = () => {
    if (!nodeData.isDir) return <div className="w-4 h-4" />
    
    if (nodeData.loading) {
      return (
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-2 h-2 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    
    return node.isOpen ? ICONS.CHEVRON_DOWN : ICONS.CHEVRON_RIGHT
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
      <span className="truncate flex-1" title={nodeData.name}>
        {nodeData.name}
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