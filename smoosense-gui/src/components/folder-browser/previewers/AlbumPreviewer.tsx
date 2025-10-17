'use client'

import { useState, useEffect } from 'react'
import { Images } from 'lucide-react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { pathJoin } from '@/lib/utils/pathUtils'
import { getFileUrl } from '@/lib/utils/apiUtils'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { loadFolderContents } from '@/lib/features/folderTree/folderTreeSlice'
import ImageBlock from '@/components/common/ImageBlock'
import GalleryVideoItem from '@/components/gallery/GalleryVideoItem'
import AlbumHeaderControls from './AlbumHeaderControls'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'

interface AlbumPreviewerProps {
  item: TreeNode
}

interface MediaFile {
  name: string
  path: string
  type: 'image' | 'video'
}

const ITEMS_PER_PAGE = 10

export default function AlbumPreviewer({ item }: AlbumPreviewerProps) {
  const dispatch = useAppDispatch()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get gallery UI settings from Redux
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)

  useEffect(() => {
    const fetchFolderContents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await dispatch(loadFolderContents({
          path: item.path,
          limit: 1000  // Load more items to find media files
        })).unwrap()

        // Filter for image and video files
        const media: MediaFile[] = result.items
          .filter(file => !file.isDir)
          .map(file => {
            const fileType = getFileType(file.name)
            if (fileType === FileType.Image) {
              return {
                name: file.name,
                path: pathJoin(item.path, file.name),
                type: 'image' as const
              }
            } else if (fileType === FileType.Video) {
              return {
                name: file.name,
                path: pathJoin(item.path, file.name),
                type: 'video' as const
              }
            }
            return null
          })
          .filter((file): file is MediaFile => file !== null)

        setMediaFiles(media)
        setCurrentPage(0) // Reset to first page
      } catch (err) {
        console.error('Error loading folder contents:', err)
        setError(err instanceof Error ? err.message : 'Failed to load folder contents')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFolderContents()
  }, [item.path, dispatch])

  const totalPages = Math.ceil(mediaFiles.length / ITEMS_PER_PAGE)
  const currentItems = mediaFiles.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  // Check if there are any videos in the current items
  const hasVideos = currentItems.some(file => file.type === 'video')

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }


  if (isLoading) {
    return <PreviewLoading message="Loading album contents..." />
  }

  if (error) {
    return (
      <PreviewError
        title="Error loading album"
        message={error}
        details={`Folder: ${item.path}`}
      />
    )
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
        <Images className="h-12 w-12 opacity-50" />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Media Files</p>
          <p className="text-sm">This folder does not contain any image or video files</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header with controls */}
      <div className="flex-shrink-0 p-4 border-b">
        <AlbumHeaderControls
          hasVideos={hasVideos}
          totalPages={totalPages}
          currentPage={currentPage}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          mediaFilesCount={mediaFiles.length}
        />
      </div>

      {/* Media grid */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="grid gap-4 justify-items-center"
          style={{
            gridTemplateColumns: `repeat(auto-fill, ${galleryItemWidth}px)`
          }}
        >
          {currentItems.map((mediaFile) => (
            <div
              key={mediaFile.path}
              className="relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-muted/30"
              style={{
                width: `${galleryItemWidth}px`,
                height: `${galleryItemHeight + 40}px` // Extra space for filename
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{ height: `${galleryItemHeight}px` }}
              >
                {mediaFile.type === 'image' ? (
                  <ImageBlock
                    src={getFileUrl(mediaFile.path, true)}
                    alt={mediaFile.name}
                    className="w-full h-full"
                  />
                ) : (
                  <GalleryVideoItem visualValue={getFileUrl(mediaFile.path, true)} />
                )}
              </div>

              {/* File name overlay */}
              <div className="p-2 bg-background border-t">
                <p className="text-xs truncate" title={mediaFile.name}>
                  {mediaFile.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}