'use client'

import VideoPlayer from '@/components/common/VideoPlayer'

interface GalleryVideoItemProps {
  visualValue: string
}

export default function GalleryVideoItem({ visualValue }: GalleryVideoItemProps) {
  return (
    <div className="group relative w-full h-full">
      <VideoPlayer
        src={visualValue}
        className="w-full h-full group-hover:opacity-100"
      />
    </div>
  )
}