'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import CellPopover from '@/components/ui/CellPopover'
import { isNil } from 'lodash'
import { proxyedUrl } from '@/lib/utils/urlUtils'
import AudioPreview from '@/components/audio/AudioPreview'
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

const AudioCellRenderer = memo(function AudioCellRenderer({
  value
}: AudioCellRendererProps) {
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const originalUrl = String(value).trim()

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !originalUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No audio
      </div>
    )
  }

  const audioUrl = proxyedUrl(originalUrl)

  const cellContent = (
    <div className="w-full h-full flex items-center justify-center p-1">
      <AudioPreview audioUrl={audioUrl} height={rowHeight - 8} />
    </div>
  )

  const popoverContent = <RichAudioPlayer audioUrl={audioUrl} autoPlay />

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={originalUrl}
      popoverClassName="w-[850px] h-[520px]"
      cellContentClassName="items-center justify-center"
      copyValue={originalUrl}
    />
  )
})

export default AudioCellRenderer
