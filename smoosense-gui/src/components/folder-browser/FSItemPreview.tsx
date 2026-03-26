'use client'

import { FileText, Download, ExternalLink, FolderOpen } from 'lucide-react'
import { useAppSelector } from '@/lib/hooks'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { pathBasename, pathDirname } from '@/lib/utils/pathUtils'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import ImagePreviewer from './previewers/ImagePreviewer'
import VideoPreviewer from './previewers/VideoPreviewer'
import AudioPreviewer from './previewers/AudioPreviewer'
import TextPreviewer from './previewers/TextPreviewer'
import JsonPreviewer from './previewers/JsonPreviewer'
import YamlPreviewer from './previewers/YamlPreviewer'
import ColumnarTablePreviewer from './previewers/ColumnarTablePreviewer'
import RowTablePreviewer from './previewers/RowTablePreviewer'
import LanceTablePreview from '@/components/db/LanceTablePreview'
import AlbumPreviewer from './previewers/AlbumPreviewer'
import NumpyPreviewer from './previewers/NumpyPreviewer'

// Dynamic imports to avoid SSR issues
const PdfPreviewer = dynamic(() => import('./previewers/PdfPreviewer'), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading PDF viewer...</div>
})

const Model3DPreviewer = dynamic(() => import('./previewers/Model3DPreviewer'), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading 3D viewer...</div>
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

// Helper function to check if a folder is a Lance table
function isLanceFolder(folder: TreeNode): boolean {
  return folder.isDir && folder.name.endsWith('.lance')
}

// Helper function to check if a folder likely contains media files
function folderLikelyContainsMedia(folder: TreeNode): boolean {
  if (!folder.isDir || !folder.children) return false

  const mediaTypes = [FileType.Image, FileType.Video, FileType.Audio, FileType.Model3D]

  // Check if any direct children are image, video, audio, or 3D model files
  return folder.children.some(child => {
    if (child.isDir) return false
    const fileType = getFileType(child.name)
    return mediaTypes.includes(fileType)
  })
}

// Helper function to get content summary for a folder
function getFolderContentSummary(folder: TreeNode): { extensionCounts: Record<string, number>; folderCount: number } | null {
  if (!folder.isDir || !folder.children) return null

  const folderCount = folder.children.filter(child => child.isDir).length
  const extensionCounts: Record<string, number> = {}

  folder.children.forEach(child => {
    if (!child.isDir) {
      const extension = child.name.includes('.')
        ? '.' + child.name.split('.').pop()!.toLowerCase()
        : '(no ext)'
      extensionCounts[extension] = (extensionCounts[extension] || 0) + 1
    }
  })

  return { extensionCounts, folderCount }
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

  // Check if the file type supports table view (including .lance folders)
  const isLanceTable = viewingItem ? isLanceFolder(viewingItem) : false
  const isTableType = fileType === FileType.ColumnarTable || fileType === FileType.RowTable || isLanceTable
  
  const renderContent = () => {
    if (!viewingItem) {
      return (
        <div className="text-center space-y-4">
          <div className="flex items-start justify-center">
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

    // Handle .lance directories (Lance tables)
    if (isLanceFolder(viewingItem)) {
      const dbPath = pathDirname(viewingItem.path)
      const tableName = viewingItem.name.replace(/\.lance$/, '')
      return <LanceTablePreview dbPath={dbPath} tableName={tableName} tableInfo={null} />
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

      case FileType.Audio:
        return <AudioPreviewer item={viewingItem} />

      case FileType.Json:
        return <JsonPreviewer item={viewingItem} />

      case FileType.Yaml:
        return <YamlPreviewer item={viewingItem} />

      case FileType.ColumnarTable:
        return <ColumnarTablePreviewer item={viewingItem} />

      case FileType.RowTable:
        return <RowTablePreviewer item={viewingItem} />

      case FileType.Text:
        return <TextPreviewer item={viewingItem} />

      case FileType.Pdf:
        return <PdfPreviewer item={viewingItem} />

      case FileType.Model3D:
        return <Model3DPreviewer modelUrl={getFileUrl(viewingItem.path, true)} />

      case FileType.Numpy:
        return <NumpyPreviewer item={viewingItem} />

      default:
        // Default view for unsupported file types or directories without media
        const contentSummary = viewingItem.isDir ? getFolderContentSummary(viewingItem) : null

        return (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              {viewingItem.isDir ? (
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
              ) : (
                <FileText className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium text-muted-foreground mb-2">
                {viewingItem.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                File Type: {viewingItem.isDir ? 'Folder' : fileType || 'Unknown'}
              </p>

              {/* Content Summary for folders */}
              {contentSummary && (Object.keys(contentSummary.extensionCounts).length > 0 || contentSummary.folderCount > 0) && (
                <div className="mt-4 mb-2 inline-block">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground justify-center">
                    {contentSummary.folderCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Folders:</span>
                        <span>{contentSummary.folderCount}</span>
                      </div>
                    )}
                    {Object.entries(contentSummary.extensionCounts)
                      .sort(([extA], [extB]) => extA.localeCompare(extB))
                      .map(([extension, count]) => (
                        <div key={extension} className="flex items-center gap-1">
                          <span className="font-medium">{extension}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

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

  const headerComponent = () => {
    return viewingItem ? (
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
    )
  }
  return (
    <div className="h-full w-full p-4 flex flex-col min-h-0">
      <div className="flex items-center space-x-2 mb-4 shrink-0">
        {headerComponent()}
      </div>

      <div className="flex-1 min-h-0 border rounded-md bg-muted/30 flex items-start justify-center p-2 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}