'use client'

import { Images } from 'lucide-react'
import dynamic from 'next/dynamic'
import { type TreeNode, loadFolderContents } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { getFileUrl } from '@/lib/utils/apiUtils'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import ImageBlock from '@/components/common/ImageBlock'
import GalleryVideoItem from '@/components/gallery/GalleryVideoItem'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'
import AlbumHeaderControls from './AlbumHeaderControls'

// Dynamic import for Model3DPreviewer to avoid SSR issues
const Model3DPreviewer = dynamic(() => import('./Model3DPreviewer'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Loading 3D...</div>
})

interface AlbumPreviewerProps {
  item: TreeNode
}

interface MediaFile {
  name: string
  path: string
  type: 'image' | 'video' | 'audio' | 'model3d'
}

export default function AlbumPreviewer({ item }: AlbumPreviewerProps) {
  const dispatch = useAppDispatch()
  const pageSize = useAppSelector((state) => state.folderTree.pageSize)
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)
  const galleryCaptionHeight = useAppSelector((state) => state.ui.galleryCaptionHeight)

  // Derive media files from already-loaded Redux tree node children
  const mediaFiles: MediaFile[] = (item.children ?? [])
    .filter(child => !child.isDir)
    .map(child => {
      const fileType = getFileType(child.name)
      if (fileType === FileType.Image) return { name: child.name, path: child.path, type: 'image' as const }
      if (fileType === FileType.Video) return { name: child.name, path: child.path, type: 'video' as const }
      if (fileType === FileType.Audio) return { name: child.name, path: child.path, type: 'audio' as const }
      if (fileType === FileType.Model3D) return { name: child.name, path: child.path, type: 'model3d' as const }
      return null
    })
    .filter((f): f is MediaFile => f !== null)

  const loadedCount = item.children?.length ?? 0
  const hasMore = item.isLoaded && item.childrenTotal > loadedCount
  const hasVideos = mediaFiles.some(f => f.type === 'video')

  const handleLoadMore = () => {
    dispatch(loadFolderContents({
      path: item.path,
      offset: loadedCount,
      append: true,
    }))
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
        <Images className="h-12 w-12 opacity-50" />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Media Files</p>
          <p className="text-sm">This folder does not contain any image, video, or audio files</p>
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
          {mediaFiles.map((mediaFile) => (
            <div
              key={mediaFile.path}
              className="relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-muted/30"
              style={{
                width: `${galleryItemWidth}px`,
                height: `${galleryItemHeight + galleryCaptionHeight}px`
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
                ) : mediaFile.type === 'video' ? (
                  <GalleryVideoItem visualValue={getFileUrl(mediaFile.path, true)} />
                ) : mediaFile.type === 'audio' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <AudioMiniMelSpectrogram
                      audioUrl={getFileUrl(mediaFile.path, true)}
                      height={galleryItemHeight}
                      allowPopOver={true}
                    />
                  </div>
                ) : (
                  <Model3DPreviewer modelUrl={getFileUrl(mediaFile.path, true)} />
                )}
              </div>

              {/* File name caption */}
              <div
                className="p-3 bg-background border-t"
                style={{ height: `${galleryCaptionHeight}px` }}
              >
                <p className="text-xs line-clamp-2 h-full overflow-hidden break-all" title={mediaFile.name}>
                  {mediaFile.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={item.loading}
              className="px-4 py-2 text-sm text-muted-foreground border rounded hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.loading ? 'Loading…' : `Load ${pageSize} more…`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
