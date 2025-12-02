'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import CellPopover from '@/components/ui/CellPopover'
import { isNil } from 'lodash'
import { mayResolveUrl } from '../mediaUrlUtils'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'
import { useAppSelector } from '@/lib/hooks'

// Lazy load the rich audio player (only loads when popover opens)
const RichAudioPlayer = dynamic(() => import('@/components/audio/RichAudioPlayer'), {
  ssr: false,
  loading: () => (
    <div className="p-4 w-full flex items-center justify-center h-[500px]">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-12 h-12 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Opening...</span>
      </div>
    </div>
  )
})

interface AudioCellRendererProps {
  value: unknown
}

interface AudioCellContentProps {
  audioUrl: string
  copyValue: string
  rowHeight: number
  alt?: string
}

/**
 * Shared audio cell content component that can be used with any audio URL (URL or data URL)
 */
export const AudioCellContent = memo(function AudioCellContent({
  audioUrl,
  copyValue,
  rowHeight,
  alt
}: AudioCellContentProps) {
  const cellContent = (
    <div className="w-full h-full flex items-center justify-center p-1">
      <AudioMiniMelSpectrogram audioUrl={audioUrl} height={rowHeight - 8} allowPopOver={false} alt={alt} />
    </div>
  )

  const popoverContent = <RichAudioPlayer audioUrl={audioUrl} autoPlay alt={alt} />

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={copyValue}
      popoverClassName="w-[500px] h-[310px]"
      cellContentClassName="items-center justify-center"
      copyValue={copyValue}
    />
  )
})

const AudioCellRenderer = memo(function AudioCellRenderer({
  value
}: AudioCellRendererProps) {
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()

  const resolvedUrl = mayResolveUrl({ value, tablePath, baseUrl })

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !originalUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No audio
      </div>
    )
  }

  return (
    <AudioCellContent
      audioUrl={resolvedUrl}
      copyValue={originalUrl}
      rowHeight={rowHeight}
      alt={originalUrl}
    />
  )
})

export default AudioCellRenderer
