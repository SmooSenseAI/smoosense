'use client'

import { memo } from 'react'
import _ from 'lodash'
import CellPopover from '@/components/ui/CellPopover'
import VideoPlayer from '@/components/common/VideoPlayer'
import { mayResolveUrl } from '../mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'

interface VideoListCellRendererProps {
  value: string[]
}

const VideoListCellRenderer = memo(function VideoListCellRenderer({
  value
}: VideoListCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)

  // Filter out empty strings and resolve URLs
  const validUrls = _.compact(value.map(url => url.trim()))
  const resolvedUrls = validUrls.map(url =>
    mayResolveUrl({ value: url, tablePath, baseUrl })
  )

  if (resolvedUrls.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No videos
      </div>
    )
  }

  // Number of videos to show in cell preview
  const previewCount = 3

  // Cell content: show first few videos in a row
  const cellContent = (
    <div className="flex gap-1 w-full h-full overflow-hidden items-center">
      {resolvedUrls.slice(0, previewCount).map((url, index) => (
        <div
          key={index}
          className="relative rounded overflow-hidden bg-muted h-full flex-shrink-0"
          style={{ maxWidth: `${100 / previewCount}%` }}
        >
          <VideoPlayer
            src={url}
            showControlsAtHover={false}
          />
        </div>
      ))}
      {resolvedUrls.length > previewCount && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          +{resolvedUrls.length - previewCount}
        </span>
      )}
    </div>
  )

  // Popover content: show all videos in a grid
  const popoverContent = (
    <div className="p-3 overflow-auto h-full">
      <div className="grid grid-cols-2 gap-2">
        {resolvedUrls.map((url, index) => (
          <div key={index} className="aspect-video">
            <VideoPlayer
              src={url}
              className="w-full h-full rounded"
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      popoverClassName="w-[600px] max-h-[500px] p-0"
      cellContentClassName="items-center justify-center"
      copyValue={validUrls.join('\n')}
      title={`${resolvedUrls.length} videos`}
    />
  )
})

export default VideoListCellRenderer
