'use client'

import { useRef, useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import WaveForm from '@/components/audio/WaveForm'
import MelSpectrogram from '@/components/audio/MelSpectrogram'
import { useAudioData } from '@/lib/hooks/useAudioData'

interface RichAudioPlayerProps {
  audioUrl: string
  autoPlay?: boolean
}

export default function RichAudioPlayer({ audioUrl, autoPlay = false }: RichAudioPlayerProps) {
  const audioRef = useRef<AudioPlayer>(null)
  const [currentTime, setCurrentTime] = useState(0)

  // Load audio data (starts loading when this component mounts, i.e., when popover opens)
  const { audioData } = useAudioData(audioUrl)

  // Handle seek from visualizations
  const handleSeek = (time: number) => {
    if (audioRef.current?.audio?.current) {
      audioRef.current.audio.current.currentTime = time
    }
  }

  // Handle time update from audio player
  const handleListen = () => {
    if (audioRef.current?.audio?.current) {
      setCurrentTime(audioRef.current.audio.current.currentTime)
    }
  }

  // Show loading spinner while audio is being downloaded/decoded
  if (!audioData) {
    return (
      <div className="p-4 w-full flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading audio...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 w-full space-y-2">

      {/* Audio player */}
      <AudioPlayer
        ref={audioRef}
        src={audioUrl}
        autoPlay={autoPlay}
        autoPlayAfterSrcChange={false}
        showJumpControls={false}
        customAdditionalControls={[]}
        layout="horizontal-reverse"
        listenInterval={100}
        onListen={handleListen}
      />
      <WaveForm
        samples={audioData.samples}
        duration={audioData.duration}
        currentTime={currentTime}
        onSeek={handleSeek}
        height={50}
      />
      <MelSpectrogram
        samples={audioData.samples}
        duration={audioData.duration}
        currentTime={currentTime}
        onSeek={handleSeek}
        height={120}
      />
    </div>
  )
}
