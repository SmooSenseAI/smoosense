'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import ImageBlock from '@/components/common/ImageBlock'
import { isNil } from 'lodash'
import { needToResolveMediaUrl, resolveAssetUrl } from '../mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'

interface ImageCellRendererProps {
  value: unknown
}

const ImageCellRenderer = memo(function ImageCellRenderer({
  value
}: ImageCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()

  // Resolve URL if needed
  const resolvedUrl = (tablePath && baseUrl && needToResolveMediaUrl(value))
    ? resolveAssetUrl(originalUrl, tablePath, baseUrl)
    : originalUrl

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !originalUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No image
      </div>
    )
  }

  const cellContent = (
      <ImageBlock
        src={resolvedUrl}
        alt="Image"
        className="rounded transition-opacity w-full h-full"
      />
  )

  const popoverContent = (
    <div className="flex items-center justify-center h-full max-h-full">
      <ImageBlock
        src={resolvedUrl}
        alt="Full size image"
        className="object-contain max-h-full"
        neverFitCover={true}
      />
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={resolvedUrl}
      popoverClassName=""
      cellContentClassName="items-center justify-center"
      copyValue={originalUrl}
    />
  )
})

export default ImageCellRenderer