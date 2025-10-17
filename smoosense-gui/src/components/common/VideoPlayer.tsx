'use client'

import { memo, useRef, useEffect, useState } from 'react'
import { useAppSelector } from '@/lib/hooks'
import { proxyedUrl } from '@/lib/utils/urlUtils'
import { Play } from 'lucide-react'

export interface VideoPlayerProps {
  src: string
  className?: string
  showControlsAtHover?: boolean
  alwaysAutoPlay?: boolean
}

const VideoPlayer = memo(function VideoPlayer({
  src,
  className = '',
  showControlsAtHover = true,
  alwaysAutoPlay = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Get Redux state for video settings
  const galleryVideoMuted = useAppSelector((state) => state.ui.galleryVideoMuted)
  const autoPlayAllVideos = useAppSelector((state) => state.ui.autoPlayAllVideos)
  const cropMediaToFitCover = useAppSelector((state) => state.ui.cropMediaToFitCover)

  const videoUrl = proxyedUrl(src)

  // Apply crop fit logic - always take full width and height
  const finalClassName = cropMediaToFitCover
    ? `w-full h-full object-cover ${className || ''}`.trim()
    : `w-full h-full object-contain ${className || ''}`.trim()

  // Determine if video should auto play
  const shouldAutoPlay = alwaysAutoPlay || autoPlayAllVideos

  // Control video playback based on autoPlay state
  useEffect(() => {
    if (videoRef.current && !hasError) {
      if (shouldAutoPlay) {
        videoRef.current.play().catch(() => {
          // Ignore play interruption errors
        })
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
    }
  }, [shouldAutoPlay, hasError])

  // Cleanup on unmount
  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video) {
        video.pause()
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (videoRef.current && !shouldAutoPlay && !hasError) {
      videoRef.current.play().catch(() => {
        // Ignore play interruption errors
      })
      setIsPlaying(true)
    }

    if (videoRef.current && showControlsAtHover) {
      videoRef.current.controls = true
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current && !shouldAutoPlay && !hasError) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }

    if (videoRef.current && showControlsAtHover) {
      videoRef.current.controls = false
    }
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setHasError(true)
    setIsPlaying(false)
    // Hide the video element on error
    const target = e.target as HTMLVideoElement
    target.style.display = 'none'
  }

  const handleLoadedData = () => {
    setHasError(false)
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className={finalClassName}
        muted={galleryVideoMuted}
        autoPlay={shouldAutoPlay}
        loop={true}
        preload="auto"
        controls={false}
        onError={handleError}
        onLoadedData={handleLoadedData}
      />
      {!shouldAutoPlay && !isPlaying && !hasError && (
        <Play className="h-8 w-8 text-white/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 pointer-events-none" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground rounded border-2 border-dashed border-border">
          <div className="text-center">
            <div className="mb-2">
              <svg className="h-8 w-8 mx-auto opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
            <div className="text-sm">Failed to load video</div>
          </div>
        </div>
      )}
    </div>
  )
})

export default VideoPlayer