'use client'

import { Slider } from '@/components/ui/slider'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setGalleryItemWidth } from '@/lib/features/ui/uiSlice'

interface GalleryItemWidthSliderProps {
  className?: string
}

export default function GalleryItemWidthSlider({ className }: GalleryItemWidthSliderProps) {
  const dispatch = useAppDispatch()
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">
        Width: {galleryItemWidth}px
      </label>
      <Slider
        min={100}
        max={600}
        step={25}
        value={[galleryItemWidth]}
        onValueChange={(value) => dispatch(setGalleryItemWidth(value[0]))}
        className="w-full min-w-50"
      />
    </div>
  )
}
