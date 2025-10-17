'use client'

import UISettingToggle from '@/components/ui/UISettingToggle'

export default function MediaSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Media Settings</h3>

      <UISettingToggle
        settingKey="cropMediaToFitCover"
        label="Crop images/videos to cover"
      />

      <UISettingToggle
        settingKey="autoPlayAllVideos"
        label="Auto Play All Videos"
      />

      <UISettingToggle
        settingKey="galleryVideoMuted"
        label="Mute Videos"
      />
    </div>
  )
}
