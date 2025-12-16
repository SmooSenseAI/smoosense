'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { toHuggingFaceDataUrl, getHuggingFaceMediaPath } from '@/lib/utils/huggingFaceMediaUtils'
import { useAppSelector } from '@/lib/hooks'
import GalleryItem from '@/components/gallery/GalleryItem'
import GalleryItemCaption from '@/components/gallery/GalleryItemCaption'
import RichAudioPlayer from '@/components/audio/RichAudioPlayer'

interface HoverItemProps {
  row: Record<string, unknown>
  index: number
  visualValue: unknown
  captionValue: unknown
  renderType: RenderType
}

export default function HoverItem({
  row,
  index,
  visualValue,
  captionValue,
  renderType
}: HoverItemProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const galleryCaptionHeight = useAppSelector((state) => state.ui.galleryCaptionHeight)

  // Check if this is audio content
  const isAudioUrl = renderType === RenderType.AudioUrl

  // Check for HuggingFace audio
  const hfPath = renderType === RenderType.HuggingFaceMedia ? getHuggingFaceMediaPath(visualValue) : ''
  const hfDataUrl = renderType === RenderType.HuggingFaceMedia ? toHuggingFaceDataUrl(visualValue) : null
  const hfFileType = hfPath ? getFileType(hfPath) : null
  const isHfAudio = renderType === RenderType.HuggingFaceMedia && hfDataUrl && hfFileType === FileType.Audio

  const isAudio = isAudioUrl || isHfAudio

  if (isAudio) {
    // Resolve audio URL
    const resolvedUrl = isHfAudio ? hfDataUrl! : mayResolveUrl({ value: visualValue, tablePath, baseUrl })
    const alt = isHfAudio ? hfPath : undefined

    return (
      <div className="w-[400px]">
        <RichAudioPlayer audioUrl={resolvedUrl} alt={alt} autoPlay={true} />
        <GalleryItemCaption
          captionValue={captionValue}
          galleryCaptionHeight={galleryCaptionHeight}
        />
      </div>
    )
  }

  // For non-audio, use GalleryItem
  return (
    <GalleryItem
      row={row}
      index={index}
      visualValue={visualValue}
      captionValue={captionValue}
      renderType={renderType}
      onClick={null}
    />
  )
}
