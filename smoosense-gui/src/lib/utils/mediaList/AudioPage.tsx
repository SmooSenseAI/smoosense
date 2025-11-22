'use client'

import { memo } from 'react'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'

interface AudioPageProps {
  resolvedUrls: string[]
  originalUrls: string[]
  columns?: number
  allowPopOver?: boolean
  showName?: boolean
}

const AudioPage = memo(function AudioPage({
  resolvedUrls,
  originalUrls,
  columns = 3,
  allowPopOver = true,
  showName = true
}: AudioPageProps) {
  if (resolvedUrls.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No audio
      </div>
    )
  }

  return (
    <div className="p-3 overflow-auto h-full">
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {resolvedUrls.map((url, index) => (
          <div key={index} className="flex-col border rounded-lg overflow-hidden p-1 ">
            <div className="flex-0">
              <AudioMiniMelSpectrogram audioUrl={url} height={80} allowPopOver={allowPopOver} />
            </div>
            {showName && (
              <div
                className="text-xs text-muted-foreground mt-1 truncate"
                style={{ direction: 'rtl', textAlign: 'left' }}
                title={originalUrls[index]}
              >
                <bdi>{originalUrls[index]}</bdi>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

export default AudioPage
