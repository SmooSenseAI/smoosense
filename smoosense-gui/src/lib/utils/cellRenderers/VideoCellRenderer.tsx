'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import VideoPlayer from '@/components/common/VideoPlayer'
import { isNil } from 'lodash'

interface VideoCellRendererProps {
  value: unknown
}

const VideoCellRenderer = memo(function VideoCellRenderer({
  value
}: VideoCellRendererProps) {
  const originalUrl = String(value).trim()

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !originalUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No video
      </div>
    )
  }

  const cellContent = (
    <div
      className="relative rounded overflow-hidden bg-muted w-full h-full"
    >
      <VideoPlayer
        src={originalUrl}
        showControlsAtHover={false}
      />
    </div>
  )

  const popoverContent = (
    <div className="relative">
      <VideoPlayer
        src={originalUrl}
        className=""
        alwaysAutoPlay={true}
      />
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      cellContentClassName="items-center justify-center"
      popoverContent={popoverContent}
      url={originalUrl}
      copyValue={originalUrl}
    />
  )
})

export default VideoCellRenderer