'use client'

import { Slider } from '@/components/ui/slider'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setGalleryItemHeight } from '@/lib/features/ui/uiSlice'

interface GalleryItemHeightSliderProps {
  className?: string
}

export default function GalleryItemHeightSlider({ className }: GalleryItemHeightSliderProps) {
  const dispatch = useAppDispatch()
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">
        Height: {galleryItemHeight}px
      </label>
      <Slider
        min={100}
        max={600}
        step={25}
        value={[galleryItemHeight]}
        onValueChange={(value) => dispatch(setGalleryItemHeight(value[0]))}
        className="w-full min-w-50"
      />
    </div>
  )
}
