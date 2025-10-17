'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import UISettingToggle from '@/components/ui/UISettingToggle'
import IconPopover from '@/components/common/IconPopover'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setGalleryItemWidth, setGalleryItemHeight, setGalleryCaptionHeight } from '@/lib/features/ui/uiSlice'

export function GalleryMoreControlsContent({ className }: { className?: string }) {
  const dispatch = useAppDispatch()
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)
  const galleryCaptionHeight = useAppSelector((state) => state.ui.galleryCaptionHeight)

  return (
    <div className={`space-y-4 w-full max-w-sm ${className || ''}`.trim()}>
      <div>
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

      <div>
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

      <div>
        <label className="text-sm font-medium mb-2 block">
          Caption Height: {galleryCaptionHeight}px
        </label>
        <Slider
          min={40}
          max={200}
          step={10}
          value={[galleryCaptionHeight]}
          onValueChange={(value) => dispatch(setGalleryCaptionHeight(value[0]))}
          className="w-full min-w-50"
        />
      </div>

      <UISettingToggle
        settingKey="cropMediaToFitCover"
        label="Crop to cover"
      />
    </div>
  )
}

export default function GalleryMoreControls() {
  return (
    <IconPopover
      icon={<SlidersHorizontal />}
      tooltip="Gallery Controls"
      contentClassName="p-4"
      align="end"
    >
      <GalleryMoreControlsContent />
    </IconPopover>
  )
}