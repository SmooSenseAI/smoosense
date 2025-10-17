'use client'

import UISettingSlider from '@/components/ui/UISettingSlider'

export default function TableSettingSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Table Display Settings</h3>

      <UISettingSlider
        settingKey="rowHeight"
        label="Row Height"
        min={40}
        max={200}
        step={10}
      />
    </div>
  )
}