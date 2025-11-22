'use client'

import { memo } from 'react'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'

interface AudioRowProps {
  resolvedUrls: string[]
  height: number
  previewCount?: number
}

const AudioRow = memo(function AudioRow({
  resolvedUrls,
  height,
  previewCount = 3
}: AudioRowProps) {
  if (resolvedUrls.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No audio
      </div>
    )
  }

  return (
    <div className="flex gap-1 w-full h-full overflow-hidden items-center p-1">
      {resolvedUrls.slice(0, previewCount).map((url, index) => (
        <div key={index} className="flex-shrink-0" style={{ width: `${100 / previewCount}%` }}>
          <AudioMiniMelSpectrogram audioUrl={url} height={height} allowPopOver={false} />
        </div>
      ))}
      {resolvedUrls.length > previewCount && (
        <span className="absolute bottom-1 right-1 text-xs text-muted-foreground bg-background/80 px-1 rounded">
          +{resolvedUrls.length - previewCount}
        </span>
      )}
    </div>
  )
})

export default AudioRow
