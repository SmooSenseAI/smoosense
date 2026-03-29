'use client'

import { Play, Square, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GalleryMoreControls from '@/components/gallery/GalleryMoreControls'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setAutoPlayAllVideos } from '@/lib/features/ui/uiSlice'

interface AlbumHeaderControlsProps {
  hasVideos: boolean
  mediaFilesCount: number
}

export default function AlbumHeaderControls({
  hasVideos,
  mediaFilesCount
}: AlbumHeaderControlsProps) {
  const dispatch = useAppDispatch()
  const autoPlayAllVideos = useAppSelector((state) => state.ui.autoPlayAllVideos)

  const handleToggleAutoPlay = () => {
    dispatch(setAutoPlayAllVideos(!autoPlayAllVideos))
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Album title and video play/stop button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          <span className="font-medium">
            {mediaFilesCount} items
          </span>
        </div>
        {hasVideos && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAutoPlay}
            className="flex items-center gap-2"
          >
            {autoPlayAllVideos ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Play
              </>
            )}
          </Button>
        )}
      </div>

      <GalleryMoreControls />
    </div>
  )
}
