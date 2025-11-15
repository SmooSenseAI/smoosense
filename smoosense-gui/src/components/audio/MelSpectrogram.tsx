'use client'

import { useEffect, useRef, useState } from 'react'
import colormap from 'colormap'

interface MelSpectrogramProps {
  samples: Float32Array
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  height?: number
  showTitle?: boolean
}

export default function MelSpectrogram({
  samples,
  duration,
  currentTime,
  onSeek,
  height = 200,
  showTitle = true
}: MelSpectrogramProps) {
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null)
  const playheadCanvasRef = useRef<HTMLCanvasElement>(null)
  const [spectrogramData, setSpectrogramData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Compute mel-spectrogram in Web Worker (background thread)
  useEffect(() => {
    let cancelled = false
    let worker: Worker | null = null

    async function computeSpectrogram() {
      try {
        setIsLoading(true)

        // Create Web Worker
        worker = new Worker(new URL('@/workers/melSpectrogram.worker.ts', import.meta.url))

        // Listen for result from worker
        worker.onmessage = (e: MessageEvent) => {
          if (cancelled) return

          if (e.data.type === 'result') {
            const sxx = e.data.data
            const imageData = spectrogramToImage(sxx)
            setSpectrogramData(imageData)
            setIsLoading(false)
          } else if (e.data.type === 'error') {
            console.error('Error computing spectrogram:', e.data.error)
            setIsLoading(false)
          }

          // Clean up worker
          worker?.terminate()
        }

        // Send computation request to worker
        worker.postMessage({
          type: 'compute',
          samples,
          sampleRate: 16000,
          nFft: 1024,
          winLength: 400,
          hopLength: 160,
          fMin: 0,
          fMax: 8000,
          nMels: 128,
          topDb: 80
        })
      } catch (error) {
        console.error('Error creating worker:', error)
        setIsLoading(false)
      }
    }

    computeSpectrogram()
    return () => {
      cancelled = true
      worker?.terminate()
    }
  }, [samples])

  // Convert spectrogram to image data URL
  function spectrogramToImage(sxx: number[][]): string {
    const numFrames = sxx.length
    const numMels = sxx[0]?.length || 128

    // Get colormap (returns number[][] for rgba format)
    const colors = colormap({
      colormap: 'viridis',
      nshades: 256,
      format: 'rgba',
      alpha: 1
    }) as number[][]

    // Find min/max for normalization
    let min = Infinity
    let max = -Infinity
    for (const frame of sxx) {
      for (const val of frame) {
        if (val < min) min = val
        if (val > max) max = val
      }
    }

    // Create canvas and fill with colors
    const canvas = document.createElement('canvas')
    canvas.width = numFrames
    canvas.height = numMels
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(numFrames, numMels)

    for (let t = 0; t < numFrames; t++) {
      for (let f = 0; f < numMels; f++) {
        const val = sxx[t][f]
        const normalized = Math.floor(((val - min) / (max - min)) * 255)
        const color = colors[normalized]

        // Flip vertically (mel bands go from low to high)
        const y = numMels - 1 - f
        const idx = (y * numFrames + t) * 4

        imgData.data[idx] = color[0]
        imgData.data[idx + 1] = color[1]
        imgData.data[idx + 2] = color[2]
        imgData.data[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)
    return canvas.toDataURL()
  }

  // Draw spectrogram (only once when data is ready)
  useEffect(() => {
    if (!spectrogramCanvasRef.current || !spectrogramData) return

    const canvas = spectrogramCanvasRef.current
    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const height = canvas.height

    // Draw spectrogram
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
    }
    img.src = spectrogramData
  }, [spectrogramData])

  // Draw playhead (updates frequently)
  useEffect(() => {
    if (!playheadCanvasRef.current || !spectrogramData) return

    const canvas = playheadCanvasRef.current
    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const canvasHeight = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight)

    // Draw playhead
    const x = (currentTime / duration) * width
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight)
    ctx.stroke()
  }, [spectrogramData, duration, currentTime])

  // Handle click to seek
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!spectrogramData || !spectrogramCanvasRef.current) return

    const canvas = spectrogramCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTime = (x / rect.width) * duration
    onSeek(Math.max(0, Math.min(duration, clickedTime)))
  }

  if (isLoading) {
    return (
      <div
        className="w-full flex items-center justify-center bg-muted/20 rounded"
        style={{ height }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Computing spectrogram...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={showTitle ? "w-full space-y-2" : "w-full"}>
      <div
        className="relative w-full cursor-pointer rounded overflow-hidden border border-border"
        style={{ height }}
        onClick={handleClick}
      >
        <canvas
          ref={spectrogramCanvasRef}
          width={800}
          height={height}
          className="absolute inset-0 w-full h-full"
        />
        <canvas
          ref={playheadCanvasRef}
          width={800}
          height={height}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
      {showTitle && (
        <div className="text-center text-sm text-muted-foreground">
          Mel Spectrogram
        </div>
      )}
    </div>
  )
}
