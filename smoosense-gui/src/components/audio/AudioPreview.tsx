'use client'

import { useRef, useEffect, useState, memo } from 'react'
import { useAudioData } from '@/lib/hooks/useAudioData'
import MelSpectrogram from '@/components/audio/MelSpectrogram'

interface AudioPreviewProps {
  audioUrl: string
  height?: number
}

const PREVIEW_DURATION = 5 // seconds
const SAMPLE_RATE = 16000 // Hz
const TRIM_THRESHOLD = 0.01 // 1% of max magnitude

const AudioPreview = memo(function AudioPreview({ audioUrl, height = 60 }: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [previewSamples, setPreviewSamples] = useState<Float32Array | null>(null)

  // Only load audio data when the cell is visible
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Once visible, stop observing
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' } // Start loading slightly before entering viewport
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const { audioData, isLoading } = useAudioData(isVisible ? audioUrl : '')

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

  if (!isVisible || isLoading || !previewSamples) {
    return (
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center bg-muted/20"
        style={{ height }}
      >
        {isVisible && (
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <MelSpectrogram
        samples={previewSamples}
        duration={PREVIEW_DURATION}
        currentTime={0}
        onSeek={() => {}} // No-op for preview
        height={height}
        showTitle={false}
      />
    </div>
  )
})

export default AudioPreview
