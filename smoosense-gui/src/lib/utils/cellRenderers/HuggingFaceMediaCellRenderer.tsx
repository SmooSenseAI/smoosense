'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import { getFileType, FileType } from '../fileTypes'
import { toHuggingFaceDataUrl, getHuggingFaceMediaPath } from '../huggingFaceMediaUtils'
import { AudioCellContent } from './AudioCellRenderer'
import { ImageCellContent } from './ImageCellRenderer'
import { useAppSelector } from '@/lib/hooks'

interface HuggingFaceMediaCellRendererProps {
  value: unknown
}

const HuggingFaceMediaCellRenderer = memo(function HuggingFaceMediaCellRenderer({
  value
}: HuggingFaceMediaCellRendererProps) {
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  // Handle empty or invalid values
  if (!value || typeof value !== 'object') {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No media
      </div>
    )
  }

  const path = getHuggingFaceMediaPath(value) || 'Unknown'
  const dataUrl = toHuggingFaceDataUrl(value)
  const fileType = getFileType(path)

  // No valid data URL - show path as fallback
  if (!dataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-start p-1 text-xs text-muted-foreground truncate">
        {path}
      </div>
    )
  }

  // Render based on file type
  if (fileType === FileType.Image) {
    return (
      <ImageCellContent
        imageUrl={dataUrl}
        copyValue={path}
      />
    )
  }

  if (fileType === FileType.Audio) {
    return (
      <AudioCellContent
        audioUrl={dataUrl}
        copyValue={path}
        rowHeight={rowHeight}
        alt={path}
      />
    )
  }

  if (fileType === FileType.Video) {
    const cellContent = (
      <div className="w-full h-full flex items-center justify-center p-1 text-xs text-muted-foreground">
        {path}
      </div>
    )

    const popoverContent = (
      <div className="p-2 w-full">
        <video controls className="w-full max-h-[400px]" src={dataUrl}>
          Your browser does not support the video element.
        </video>
      </div>
    )

    return (
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        url={path}
        popoverClassName="w-[500px]"
        cellContentClassName="items-center justify-center"
        copyValue={path}
      />
    )
  }

  // Fallback for unsupported types
  return (
    <div className="w-full h-full flex items-center justify-start p-1 text-xs text-muted-foreground truncate">
      {path}
    </div>
  )
})

export default HuggingFaceMediaCellRenderer
