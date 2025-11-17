'use client'

import { ResizablePanels } from '@/components/ui/resizable-panels'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import AudioMiniMelSpectrogram from '@/components/audio/AudioMiniMelSpectrogram'
import { startCase } from 'lodash'

// Example audio files from ESC-50 dataset subset
const EXAMPLE_AUDIO_FILES = [
  'airplane.wav',
  'can_opening.wav',
  'car_horn.wav',
  'cat.wav',
  'chainsaw.wav',
  'chirping_birds.wav',
  'church_bells.wav',
  'clock_alarm.wav',
  'clock_tick.wav',
  'coughing.wav',
  'crickets.wav',
  'crying_baby.wav',
  'dog.wav',
  'door_wood_creaks.wav',
  'door_wood_knock.wav',
  'drinking_sipping.wav',
  'engine.wav',
  'fireworks.wav',
  'frog.wav',
  'keyboard_typing.wav',
  'laughing.wav',
  'nips4b_birds_trainfile001.wav',
  'pouring_water.wav',
  'rooster.wav',
  'sea_waves.wav',
  'siren.wav',
  'vacuum_cleaner.wav',
  'water_drops.wav'
]

// Helper function to convert filename to display name
function filenameToDisplayName(filename: string): string {
  return startCase(filename.replace('.wav', ''))
}

const MARKDOWN_CONTENT = `# Audio Mel-Spectrogram Visualization

SmooSense provides rich audio visualization capabilities including waveforms and mel-spectrograms, helping users analyze audio data with professional-grade tools.

## What is a Mel-Spectrogram?

A mel-spectrogram is a visual representation of the spectrum of frequencies in a sound as they vary with time. The "mel" scale is designed to match human auditory perception, making it particularly useful for:

- **Speech recognition** - Identifying phonemes and speech patterns
- **Music analysis** - Understanding harmonic content and timbre
- **Sound classification** - Distinguishing between different types of audio
- **Audio quality assessment** - Detecting artifacts and distortions

## Understanding the Visualizations

- **X-axis**: Time
- **Y-axis**: Frequency (mel scale)
- **Color**: Energy/intensity at each frequency
    - **Brighter colors** = Higher energy
    - **Darker colors** = Lower energy

The mel scale compresses higher frequencies, matching how humans perceive pitch. This makes it easier to analyze speech and music compared to linear frequency scales.

---

## How to Use in Your Data

SmooSense automatically detects and visualizes audio files in common formats:

### Supported Formats
- **WAV** - Uncompressed audio (best quality)
- **MP3** - Compressed audio
- **OGG** - Open-source compressed format
- **FLAC** - Lossless compression
- **M4A/AAC** - Apple/MPEG-4 audio

### In Table View
When your dataset contains audio file paths or URLs:
1. SmooSense will automatically detect audio columns
2. Click any cell to preview the audio
3. The mel-spectrogram renders instantly for quick analysis

### In Folder Browser
Navigate to folders containing audio files:
1. Select any audio file in the tree view
2. See waveform and mel-spectrogram in the preview pane
3. Play directly from the browser

---


`

// Component for rendering the audio grid
function AudioGrid() {
  return (
    <div className="flex-shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {EXAMPLE_AUDIO_FILES.map((filename, index) => {
          const audioUrl = `https://cdn.smoosense.ai/datasets/ESC-50-subset/${filename}`
          const displayName = filenameToDisplayName(filename)

          return (
            <div
              key={index}
              className="border rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-primary"
            >
              <div className="flex flex-col">
                <div className="w-full">
                  <AudioMiniMelSpectrogram
                    audioUrl={audioUrl}
                    height={90}
                    allowPopOver={true}
                  />
                </div>
                <div className="p-2">
                  <span className="text-sm text-center font-medium line-clamp-1 truncate block">
                    {displayName}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ExampleAudioMelSpectrogramProps {
  className?: string
  visualOnly?: boolean
}

export default function ExampleAudioMelSpectrogram({ className, visualOnly = false }: ExampleAudioMelSpectrogramProps) {
  const audioGridContent = (
    <div className="h-full flex flex-col p-6 bg-background overflow-auto">
      <AudioGrid />
    </div>
  )

  if (visualOnly) {
    return (
      <div className={`h-full w-full ${className || ''}`}>
        {audioGridContent}
      </div>
    )
  }

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[60, 40]}
        minSize={30}
        maxSize={70}
      >
        {audioGridContent}

        <div className="h-full p-6 bg-background border-l overflow-y-auto">
          <CustomMarkdown>{MARKDOWN_CONTENT}</CustomMarkdown>
        </div>
      </ResizablePanels>
    </div>
  )
}
