'use client'

import { memo } from 'react'
import { ICellRendererParams } from 'ag-grid-community'

const PercentageRenderer = memo(function PercentageRenderer({ value }: ICellRendererParams) {
  if (value === null || value === undefined || typeof value !== 'number') {
    return <div className="p-1">-</div>
  }

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="relative w-full h-full p-1">
      <div className="w-full  rounded h-full border">
        <div 
          className="bg-[var(--chart-default-fill)] h-full rounded transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
        {clampedValue.toFixed(2)}%
      </span>
    </div>
  )
})

export default PercentageRenderer