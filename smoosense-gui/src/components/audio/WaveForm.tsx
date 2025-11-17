'use client'

import { useEffect, useRef, useState } from 'react'

interface WaveFormProps {
  samples: Float32Array
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  height?: number
}

export default function WaveForm({
  samples,
  duration,
  currentTime,
  onSeek,
  height = 80
}: WaveFormProps) {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const playheadCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(800)

  // Measure container width and update canvas width
  useEffect(() => {
    if (!containerRef.current) return

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        setCanvasWidth(width)
      }
    }

    // Initial measurement
    updateWidth()

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Draw waveform (only once when data is ready)
  useEffect(() => {
    if (!waveformCanvasRef.current) return

    const canvas = waveformCanvasRef.current
    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const canvasHeight = canvas.height

    ctx.clearRect(0, 0, width, canvasHeight)

    // Draw waveform
    const step = Math.floor(samples.length / width)

    // Get computed color from CSS variable
    const waveColor = getComputedStyle(canvas).getPropertyValue('--chart-default-fill').trim()
    ctx.strokeStyle = waveColor || '#3b82f6'
    ctx.lineWidth = 1.5
    ctx.beginPath()

    for (let i = 0; i < width; i++) {
      const sampleIndex = i * step
      const sample = samples[sampleIndex] || 0

      // Normalize to canvas height
      const y = (canvasHeight / 2) * (1 - sample)

      if (i === 0) {
        ctx.moveTo(i, y)
      } else {
        ctx.lineTo(i, y)
      }
    }

    ctx.stroke()

    // Draw center line
    ctx.strokeStyle = 'hsl(var(--border))'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvasHeight / 2)
    ctx.lineTo(width, canvasHeight / 2)
    ctx.stroke()
  }, [samples, canvasWidth])

  // Draw playhead (updates frequently)
  useEffect(() => {
    if (!playheadCanvasRef.current) return

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
  }, [duration, currentTime])

  // Handle click to seek
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!waveformCanvasRef.current) return

    const canvas = waveformCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTime = (x / rect.width) * duration
    onSeek(Math.max(0, Math.min(duration, clickedTime)))
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full cursor-pointer rounded overflow-hidden bg-muted/20 border border-border"
        style={{ height }}
        onClick={handleClick}
      >
        <canvas
          ref={waveformCanvasRef}
          width={canvasWidth}
          height={height}
          className="absolute inset-0 w-full h-full"
        />
        <canvas
          ref={playheadCanvasRef}
          width={canvasWidth}
          height={height}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  )
}
