'use client'

import { ChevronLeft, ChevronRight, Play, Square, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GalleryMoreControlsContent } from '@/components/gallery/GalleryMoreControls'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setAutoPlayAllVideos } from '@/lib/features/ui/uiSlice'

interface AlbumHeaderControlsProps {
  hasVideos: boolean
  totalPages: number
  currentPage: number
  onPrevPage: () => void
  onNextPage: () => void
  mediaFilesCount: number
}

export default function AlbumHeaderControls({
  hasVideos,
  totalPages,
  currentPage,
  onPrevPage,
  onNextPage,
  mediaFilesCount
}: AlbumHeaderControlsProps) {
  const dispatch = useAppDispatch()
  const autoPlayAllVideos = useAppSelector((state) => state.ui.autoPlayAllVideos)

  const handleToggleAutoPlay = () => {
    dispatch(setAutoPlayAllVideos(!autoPlayAllVideos))
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Album title and video play/stop button - leftmost */}
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

      {/* Gallery controls - middle */}
      <GalleryMoreControlsContent className="flex items-center gap-4 space-y-0 max-w-none min-w-140" />

      {/* Pagination controls - rightmost */}
      <div className="flex items-center gap-2">
        {totalPages > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}