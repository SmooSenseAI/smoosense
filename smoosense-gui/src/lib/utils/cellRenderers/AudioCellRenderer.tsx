'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import { isNil } from 'lodash'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import { proxyedUrl } from '@/lib/utils/urlUtils'
import { Volume2 } from 'lucide-react'

interface AudioCellRendererProps {
  value: unknown
}

const AudioCellRenderer = memo(function AudioCellRenderer({
  value
}: AudioCellRendererProps) {
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
    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-1">
      <Volume2 className="h-8 w-8" />
    </div>
  )

  const popoverContent = (
    <div className="p-4 w-full">
      <AudioPlayer
        src={audioUrl}
        autoPlay
        autoPlayAfterSrcChange={false}
        showJumpControls={false}
        customAdditionalControls={[]}
        layout="horizontal-reverse"
      />
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={originalUrl}
      popoverClassName="w-[500px] h-[150px]"
      cellContentClassName="items-center justify-center"
      copyValue={originalUrl}
    />
  )
})

export default AudioCellRenderer
