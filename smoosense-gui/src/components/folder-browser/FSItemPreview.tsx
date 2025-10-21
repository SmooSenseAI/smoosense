'use client'

import { FileText, Download, ExternalLink } from 'lucide-react'
import { useAppSelector } from '@/lib/hooks'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { pathBasename } from '@/lib/utils/pathUtils'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import ImagePreviewer from './previewers/ImagePreviewer'
import VideoPreviewer from './previewers/VideoPreviewer'
import TextPreviewer from './previewers/TextPreviewer'
import JsonPreviewer from './previewers/JsonPreviewer'
import ColumnarTablePreviewer from './previewers/ColumnarTablePreviewer'
import RowTablePreviewer from './previewers/RowTablePreviewer'
import AlbumPreviewer from './previewers/AlbumPreviewer'

// Dynamic import for PdfPreviewer to avoid SSR issues
const PdfPreviewer = dynamic(() => import('./previewers/PdfPreviewer'), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading PDF viewer...</div>
})

// Helper function to find a node by ID in the tree
function findNodeById(node: TreeNode | null, targetId: string): TreeNode | null {
  if (!node) return null
  if (node.id === targetId) return node

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId)
      if (found) return found
    }
  }

  return null
}

// Helper function to check if a folder likely contains media files
function folderLikelyContainsMedia(folder: TreeNode): boolean {
  if (!folder.isDir || !folder.children) return false

  // Check if any direct children are image or video files
  return folder.children.some(child => {
    if (child.isDir) return false
    const fileType = getFileType(child.name)
    return fileType === FileType.Image || fileType === FileType.Video
  })
}

export default function FSItemPreview() {
  const viewingId = useAppSelector(state => state.folderTree.viewingId)
  const rootNode = useAppSelector(state => state.folderTree.rootNode)

  // Find the currently viewing item
  const viewingItem = viewingId ? findNodeById(rootNode, viewingId) : null

  // Check file type
  const fileType = viewingItem && !viewingItem.isDir ? getFileType(viewingItem.name) : null

  const handleDownload = () => {
    if (viewingItem) {
      const url = getFileUrl(viewingItem.path, true)
      window.open(url, '_blank')
    }
  }

  const handleOpenInTable = () => {
    if (viewingItem) {
      const url = `./Table?tablePath=${encodeURIComponent(viewingItem.path)}`
      window.open(url, '_blank')
    }
  }

  // Check if the file type supports table view
  const isTableType = fileType === FileType.ColumnarTable || fileType === FileType.RowTable
  
  const renderContent = () => {
    if (!viewingItem) {
      return (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Select a file from the folder navigation to preview its contents
            </p>
          </div>
        </div>
      )
    }

    // Handle directories that contain media files
    if (viewingItem.isDir && folderLikelyContainsMedia(viewingItem)) {
      return <AlbumPreviewer item={viewingItem} />
    }

    // Handle different file types with specific previewers
    switch (fileType) {
      case FileType.Image:
        return <ImagePreviewer item={viewingItem} />

      case FileType.Video:
        return <VideoPreviewer item={viewingItem} />

      case FileType.Json:
        return <JsonPreviewer item={viewingItem} />

      case FileType.ColumnarTable:
        return <ColumnarTablePreviewer item={viewingItem} />

      case FileType.RowTable:
        return <RowTablePreviewer item={viewingItem} />

      case FileType.Text:
        return <TextPreviewer item={viewingItem} />

      case FileType.Pdf:
        return <PdfPreviewer item={viewingItem} />

      default:
        // Default view for unsupported file types or directories without media
        return (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-muted-foreground mb-2">
                {viewingItem.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                File Type: {viewingItem.isDir ? 'Folder' : fileType || 'Unknown'}
              </p>
              <p className="text-sm text-muted-foreground">
                {viewingItem.isDir
                  ? 'This folder does not contain media files for album preview'
                  : 'Preview not available for this file type'
                }
              </p>
            </div>
          </div>
        )
    }
  }
  
  return (
    <div className="h-full w-full p-4">
      <div className="flex items-center space-x-2 mb-4">
        {viewingItem ? (
          <>
            <h3 className="font-medium text-sm">{pathBasename(viewingItem.path)}</h3>
            {isTableType && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenInTable}
                title="Open in Table view"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {!viewingItem.isDir && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <CopyToClipboard value={viewingItem.path} />
          </>
        ) : (
          <h3 className="font-medium text-sm">File Previewer</h3>
        )}
      </div>

      <div className="h-full border rounded-lg bg-muted/30 flex items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  )
}