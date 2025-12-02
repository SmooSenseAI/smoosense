'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import ImageBlock from '@/components/common/ImageBlock'
import { isNil } from 'lodash'
import { mayResolveUrl } from '../mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'

interface ImageCellRendererProps {
  value: unknown
}

interface ImageCellContentProps {
  imageUrl: string
  copyValue: string
}

/**
 * Shared image cell content component that can be used with any image URL (URL or data URL)
 */
export const ImageCellContent = memo(function ImageCellContent({
  imageUrl,
  copyValue
}: ImageCellContentProps) {
  const cellContent = (
    <ImageBlock
      src={imageUrl}
      alt="Image"
      className="rounded transition-opacity w-full h-full"
    />
  )

  const popoverContent = (
    <div className="flex items-center justify-center h-full max-h-full">
      <ImageBlock
        src={imageUrl}
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
      url={copyValue}
      popoverClassName=""
      cellContentClassName="items-center justify-center"
      copyValue={copyValue}
    />
  )
})

const ImageCellRenderer = memo(function ImageCellRenderer({
  value
}: ImageCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()

  const resolvedUrl = mayResolveUrl({ value, tablePath, baseUrl })

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !originalUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No image
      </div>
    )
  }

  return (
    <ImageCellContent
      imageUrl={resolvedUrl}
      copyValue={originalUrl}
    />
  )
})

export default ImageCellRenderer