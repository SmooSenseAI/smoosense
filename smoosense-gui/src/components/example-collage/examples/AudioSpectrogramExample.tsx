'use client'

import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'

// Example audio files from ESC-50 dataset subset
const EXAMPLE_AUDIO_FILES = [
  'crying_baby.wav',
  'chirping_birds.wav',
  'crickets.wav',
]

export function AudioSpectrogramVisual() {
  return (
    <div className="w-full h-full p-2 overflow-auto">
      <div className="grid grid-cols-3 gap-2 h-full">
        {EXAMPLE_AUDIO_FILES.map((filename, index) => {
          const audioUrl = `https://cdn.smoosense.ai/datasets/ESC-50-subset/${filename}`

          return (
            <div
              key={index}
              className="border rounded overflow-hidden flex flex-col h-[148px]"
            >
              <div className="flex-1 min-h-0">
                <AudioMiniMelSpectrogram
                  audioUrl={audioUrl}
                  height={120}
                  allowPopOver={true}
                />
              </div>
              <div className="p-1 text-center">
                <span className="text-sm font-medium truncate block">
                  {filename}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AudioSpectrogramDescription() {
  return (
    <div className="text-sm">
      <p>Mel-spectrograms and waveform were generated on the fly from raw audio file.</p>
    </div>
  )
}
