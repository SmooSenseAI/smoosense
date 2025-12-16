'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import VideoPlayer from '@/components/common/VideoPlayer'
import { isNil } from 'lodash'
import { mayResolveUrl } from '../mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'

interface VideoCellRendererProps {
  value: unknown
}

const VideoCellRenderer = memo(function VideoCellRenderer({
  value
}: VideoCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()

  const resolvedUrl = mayResolveUrl({ value, tablePath, baseUrl })

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
        src={resolvedUrl}
        showControlsAtHover={false}
      />
    </div>
  )

  const popoverContent = (
    <div className="relative max-h-full h-full">
      <VideoPlayer
        src={resolvedUrl}
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
      url={resolvedUrl}
      copyValue={originalUrl}
    />
  )
})

export default VideoCellRenderer