'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { parseBbox, buildBboxVizUrl } from '@/lib/utils/bboxUtils'
import ImageBlock from '@/components/common/ImageBlock'
import ImageMask from '@/components/viz/ImageMask'
import GalleryVideoItem from './GalleryVideoItem'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'
import { useAppSelector } from '@/lib/hooks'

interface GalleryItemVisualProps {
  renderType: RenderType
  visualValue: unknown
  row: Record<string, unknown>
  index: number
  galleryItemHeight: number
}

export default function GalleryItemVisual({
  renderType,
  visualValue,
  row,
  index,
  galleryItemHeight
}: GalleryItemVisualProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)

  // Resolve URLs once to avoid repeated function calls
  const resolvedVisualUrl = mayResolveUrl({ value: visualValue, tablePath, baseUrl })
  const resolvedImageUrl = mayResolveUrl({ value: row.image_url, tablePath, baseUrl })

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${galleryItemHeight}px` }}
    >
      {renderType === RenderType.ImageUrl && (
        <ImageBlock
          src={resolvedVisualUrl}
          alt={`Row ${index + 1}`}
          className="w-full h-full"
        />
      )}

      {renderType === RenderType.ImageMask && (
        <ImageMask
          image_url={resolvedImageUrl}
          mask_url={resolvedVisualUrl}
          alt={`Row ${index + 1}`}
        />
      )}

      {renderType === RenderType.VideoUrl && (
        <GalleryVideoItem visualValue={resolvedVisualUrl} />
      )}

      {renderType === RenderType.AudioUrl && (
        <div className="w-full h-full flex items-center justify-center">
          <AudioMiniMelSpectrogram audioUrl={resolvedVisualUrl} height={galleryItemHeight} allowPopOver={true} />
        </div>
      )}

      {renderType === RenderType.Bbox && (() => {
        const bbox = parseBbox(visualValue)
        const imageUrl = row.image_url

        if (!bbox || !imageUrl || typeof imageUrl !== 'string' || !baseUrl) {
          return null
        }

        const vizUrl = buildBboxVizUrl(imageUrl, [bbox], baseUrl)

        return (
          <iframe
            src={vizUrl}
            className="w-full h-full border-0"
            title={`Row ${index + 1}`}
            style={{ backgroundColor: 'transparent' }}
          />
        )
      })()}

      {renderType === RenderType.IFrame && (() => {
        let iframeUrl = String(visualValue)

        // Strip iframe+ prefix if present
        if (iframeUrl.startsWith('iframe+http://') || iframeUrl.startsWith('iframe+https://')) {
          iframeUrl = iframeUrl.replace(/^iframe\+/, '')
        }

        return (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title={`Row ${index + 1}`}
            style={{ backgroundColor: 'transparent' }}
          />
        )
      })()}
    </div>
  )
}