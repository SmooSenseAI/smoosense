'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { parseBbox, buildBboxVizUrl } from '@/lib/utils/bboxUtils'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { toHuggingFaceDataUrl, getHuggingFaceMediaPath } from '@/lib/utils/huggingFaceMediaUtils'
import ImageBlock from '@/components/common/ImageBlock'
import ImageMask from '@/components/viz/ImageMask'
import GalleryVideoItem from './GalleryVideoItem'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'
import ComplexDataGalleryItemVisual from './ComplexDataGalleryItemVisual'
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

  // Get HuggingFace media info if applicable
  const hfPath = renderType === RenderType.HuggingFaceMedia ? getHuggingFaceMediaPath(visualValue) : ''
  const hfDataUrl = renderType === RenderType.HuggingFaceMedia ? toHuggingFaceDataUrl(visualValue) : null
  const hfFileType = hfPath ? getFileType(hfPath) : null

  // Determine effective render info for HuggingFace media
  const isHfImage = renderType === RenderType.HuggingFaceMedia && hfDataUrl && hfFileType === FileType.Image
  const isHfAudio = renderType === RenderType.HuggingFaceMedia && hfDataUrl && hfFileType === FileType.Audio
  const isHfVideo = renderType === RenderType.HuggingFaceMedia && hfDataUrl && hfFileType === FileType.Video

  // Render content
  let content: React.ReactNode = null

  if (renderType === RenderType.ImageUrl || isHfImage) {
    // Image: URL or HuggingFace image
    const src = isHfImage ? hfDataUrl! : resolvedVisualUrl
    const alt = isHfImage ? hfPath : `Row ${index + 1}`
    content = (
      <ImageBlock
        src={src}
        alt={alt}
        className="w-full h-full"
      />
    )
  } else if (renderType === RenderType.ImageMask) {
    // Image mask
    content = (
      <ImageMask
        image_url={resolvedImageUrl}
        mask_url={resolvedVisualUrl}
        alt={`Row ${index + 1}`}
      />
    )
  } else if (renderType === RenderType.VideoUrl || isHfVideo) {
    // Video: URL or HuggingFace video
    const src = isHfVideo ? hfDataUrl! : resolvedVisualUrl
    content = <GalleryVideoItem visualValue={src} />
  } else if (renderType === RenderType.AudioUrl || isHfAudio) {
    // Audio: URL or HuggingFace audio
    const src = isHfAudio ? hfDataUrl! : resolvedVisualUrl
    const alt = isHfAudio ? hfPath : undefined
    content = (
      <div className="w-full h-full flex items-center justify-center">
        <AudioMiniMelSpectrogram audioUrl={src} height={galleryItemHeight} allowPopOver={true} alt={alt} />
      </div>
    )
  } else if (renderType === RenderType.Bbox) {
    // Bbox visualization
    const bbox = parseBbox(visualValue)
    const imageUrl = row.image_url

    if (bbox && imageUrl && typeof imageUrl === 'string' && baseUrl && tablePath) {
      const vizUrl = buildBboxVizUrl(imageUrl, [bbox], tablePath, baseUrl)
      content = (
        <iframe
          src={vizUrl}
          className="w-full h-full border-0"
          title={`Row ${index + 1}`}
          style={{ backgroundColor: 'transparent' }}
        />
      )
    }
  } else if (renderType === RenderType.IFrame) {
    // IFrame
    let iframeUrl = String(visualValue)
    if (iframeUrl.startsWith('iframe+http://') || iframeUrl.startsWith('iframe+https://')) {
      iframeUrl = iframeUrl.replace(/^iframe\+/, '')
    }
    content = (
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0"
        title={`Row ${index + 1}`}
        style={{ backgroundColor: 'transparent' }}
      />
    )
  } else if (renderType === RenderType.Json) {
    // JSON/Complex data
    content = (
      <ComplexDataGalleryItemVisual
        value={visualValue}
        galleryItemHeight={galleryItemHeight}
      />
    )
  } else if (renderType === RenderType.HuggingFaceMedia) {
    // HuggingFace media fallback (no valid data URL or unsupported type)
    content = (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        {hfPath || 'No media'}
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${galleryItemHeight}px` }}
    >
      {content}
    </div>
  )
}