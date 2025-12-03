'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import UISettingToggle from '@/components/ui/UISettingToggle'
import IconPopover from '@/components/common/IconPopover'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setGalleryCaptionHeight } from '@/lib/features/ui/uiSlice'
import GalleryItemWidthSlider from '@/components/settings/GalleryItemWidthSlider'
import GalleryItemHeightSlider from '@/components/settings/GalleryItemHeightSlider'

export function GalleryMoreControlsContent({ className }: { className?: string }) {
  const dispatch = useAppDispatch()
  const galleryCaptionHeight = useAppSelector((state) => state.ui.galleryCaptionHeight)

  return (
    <div className={`space-y-4 w-full max-w-sm ${className || ''}`.trim()}>
      <GalleryItemWidthSlider />
      <GalleryItemHeightSlider />

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