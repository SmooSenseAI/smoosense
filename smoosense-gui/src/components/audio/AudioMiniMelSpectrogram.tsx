'use client'

import { useEffect, useState, useRef, memo } from 'react'
import dynamic from 'next/dynamic'
import { useAudioData } from '@/lib/hooks/useAudioData'
import MelSpectrogram from '@/components/audio/MelSpectrogram'
import CellPopover from '@/components/ui/CellPopover'

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

interface AudioMiniMelSpectrogramProps {
  audioUrl: string
  height?: number
  allowPopOver?: boolean
}

const PREVIEW_DURATION = 5 // seconds
const SAMPLE_RATE = 16000 // Hz
const TRIM_THRESHOLD = 0.01 // 1% of max magnitude

const AudioMiniMelSpectrogram = memo(function AudioMiniMelSpectrogram({
  audioUrl,
  height = 60,
  allowPopOver = true
}: AudioMiniMelSpectrogramProps) {
  const [previewSamples, setPreviewSamples] = useState<Float32Array | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track visibility with Intersection Observer
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Once visible, stop observing
            observer.unobserve(element)
          }
        })
      },
      {
        rootMargin: '50px', // Start loading slightly before visible
        threshold: 0
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Only load audio when visible
  const { audioData, isLoading, error } = useAudioData(isVisible ? audioUrl : '')

  // Extract or pad to 5 seconds, with trimming - save to state
  useEffect(() => {
    if (!audioData) {
      setPreviewSamples(null)
      return
    }

    const targetSamples = PREVIEW_DURATION * SAMPLE_RATE // 5 seconds at 16kHz = 80000 samples
    const samples = audioData.samples

    // Find max magnitude
    let maxMagnitude = 0
    for (let i = 0; i < samples.length; i++) {
      const magnitude = Math.abs(samples[i])
      if (magnitude > maxMagnitude) {
        maxMagnitude = magnitude
      }
    }

    // Trim beginning if magnitude is very small (less than 1% of max)
    const threshold = maxMagnitude * TRIM_THRESHOLD
    let trimStart = 0
    for (let i = 0; i < samples.length; i++) {
      if (Math.abs(samples[i]) >= threshold) {
        trimStart = i
        break
      }
    }

    // Get trimmed samples
    const trimmedSamples = samples.slice(trimStart)

    // Take first 5 seconds or pad with zeros
    let processedSamples: Float32Array
    if (trimmedSamples.length >= targetSamples) {
      // Take first 5 seconds
      processedSamples = trimmedSamples.slice(0, targetSamples)
    } else {
      // Pad with zeros to make it 5 seconds
      const padded = new Float32Array(targetSamples)
      padded.set(trimmedSamples, 0)
      processedSamples = padded
    }

    setPreviewSamples(processedSamples)
  }, [audioData])

  const loadingContent = (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center bg-muted/20"
      style={{ height }}
    >
      <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Show placeholder until visible, or while loading
  if (!isVisible || isLoading) {
    return loadingContent
  }

  // Show error message if loading failed
  if (error) {
    return (
      <div
        ref={containerRef}
        className="w-full flex items-center justify-start bg-muted/20 text-destructive text-xs p-1 overflow-hidden"
        style={{ height }}
      >
        <span className="break-all line-clamp-3 text-left">{error.message}</span>
      </div>
    )
  }

  // Show message if no audio data
  if (!previewSamples) {
    return (
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center bg-muted/20 text-muted-foreground text-xs"
        style={{ height }}
      >
        No audio data
      </div>
    )
  }

  const melSpectrogramContent = (
    <div className="w-full">
      <MelSpectrogram
        samples={previewSamples}
        duration={PREVIEW_DURATION}
        currentTime={0}
        onSeek={() => {}} // No-op for preview
        height={height}
      />
    </div>
  )

  if (!allowPopOver) {
    return melSpectrogramContent
  }

  return (
    <CellPopover
      cellContent={melSpectrogramContent}
      popoverContent={<RichAudioPlayer audioUrl={audioUrl} autoPlay />}
      url={audioUrl}
      popoverClassName="w-[500px] h-[310px]"
      cellContentClassName="items-center justify-center"
      copyValue={audioUrl}
      side="right"
    />
  )
})

export default AudioMiniMelSpectrogram
