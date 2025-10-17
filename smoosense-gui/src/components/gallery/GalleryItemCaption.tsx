'use client'

import { isNil } from 'lodash'
import { useAppSelector } from '@/lib/hooks'
import { useRenderType } from '@/lib/hooks'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import WordScores from '@/components/viz/WordScores'

interface GalleryItemCaptionProps {
  captionValue: unknown
  galleryCaptionHeight: number
}

export default function GalleryItemCaption({
  captionValue,
  galleryCaptionHeight
}: GalleryItemCaptionProps) {
  const columnForGalleryCaption = useAppSelector((state) => state.ui.columnForGalleryCaption)
  const renderTypeColumns = useRenderType()
  const captionRenderType = renderTypeColumns[columnForGalleryCaption]
  if (isNil(captionValue)) {
    return null
  }

  return (
    <div
      className="p-3 bg-background border-t"
      style={{ height: `${galleryCaptionHeight}px` }}
    >
      <div className="text-sm text-foreground line-clamp-2 h-full overflow-hidden" title={String(captionValue)}>
        {captionRenderType === RenderType.WordScores ? (
          <WordScores value={String(captionValue)} />
        ) : (
          <p className="text-sm text-foreground line-clamp-2 h-full overflow-hidden">
            {String(captionValue)}
          </p>
        )}
      </div>
    </div>
  )
}