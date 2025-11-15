import { useEffect, useState } from 'react'

interface AudioData {
  samples: Float32Array
  duration: number
}

interface UseAudioDataResult {
  audioData: AudioData | null
  isLoading: boolean
  error: Error | null
}

// Global cache for decoded audio
const audioCache = new Map<string, AudioData>()

export function useAudioData(audioUrl: string): UseAudioDataResult {
  const [audioData, setAudioData] = useState<AudioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAudio() {
      try {
        // Skip loading if no URL provided
        if (!audioUrl) {
          setAudioData(null)
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        setError(null)

        // Check cache first
        const cached = audioCache.get(audioUrl)
        if (cached) {
          if (!cancelled) {
            setAudioData(cached)
            setIsLoading(false)
          }
          return
        }

        // Fetch and decode audio
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()

        const audioContext = new AudioContext({ sampleRate: 16000 })
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const samples = audioBuffer.getChannelData(0)
        const duration = audioBuffer.duration

        const data = { samples, duration }

        // Store in cache
        audioCache.set(audioUrl, data)

        if (!cancelled) {
          setAudioData(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load audio'))
          setIsLoading(false)
        }
      }
    }

    loadAudio()
    return () => {
      cancelled = true
    }
  }, [audioUrl])

  return { audioData, isLoading, error }
}
