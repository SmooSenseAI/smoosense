'use client'

import { useAppSelector } from '@/lib/hooks'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import GalleryItemVisual from './GalleryItemVisual'
import GalleryItemCaption from './GalleryItemCaption'

interface GalleryItemProps {
  row: Record<string, unknown>
  index: number
  visualValue: unknown
  captionValue: unknown
  renderType: RenderType
  onClick?: ((event: React.MouseEvent) => void) | null
}

export default function GalleryItem({
  row,
  index,
  visualValue,
  captionValue,
  renderType,
  onClick = null
}: GalleryItemProps) {
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)
  const galleryCaptionHeight = useAppSelector((state) => state.ui.galleryCaptionHeight)
  const itemStyle = {
    width: `${galleryItemWidth}px`,
    height: `${galleryItemHeight + galleryCaptionHeight}px`
  }

  const baseClasses = "gallery-item border rounded-lg overflow-hidden transition-all"
  const cursorClass = onClick ? "cursor-pointer hover:shadow-md hover:ring-1 hover:ring-primary" : ""

  return (
    <div
      className={`${baseClasses} ${cursorClass}`}
      style={itemStyle}
      onClick={onClick ?? undefined}
    >
      <GalleryItemVisual
        renderType={renderType}
        visualValue={visualValue}
        row={row}
        index={index}
        galleryItemHeight={galleryItemHeight}
      />

      <GalleryItemCaption
        captionValue={captionValue}
        galleryCaptionHeight={galleryCaptionHeight}
      />
    </div>
  )
}