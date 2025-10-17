'use client'

import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'

export default function HistogramControl() {
  return (
    <div className="flex-shrink-0 p-4 border-b bg-background space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <CategoricalColumnDropdown
          settingKey="histogramBreakdownColumn"
          label="Breakdown Column"
        />

        <NumericalColumnDropdown
          settingKey="histogramColumn"
          label="Histogram Column"
        />
      </div>
    </div>
  )
}