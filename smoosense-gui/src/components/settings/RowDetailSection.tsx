'use client'

import UISettingToggle from '@/components/ui/UISettingToggle'

export default function RowDetailSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Row Details</h3>

      <UISettingToggle
        settingKey="showRowDetailsPanel"
        label="Show Row Details Panel"
        description="Display detailed information panel when clicking on table rows"
      />
    </div>
  )
}
