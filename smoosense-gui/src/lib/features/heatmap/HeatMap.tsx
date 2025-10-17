'use client'

import HeatMapControls from '@/lib/features/heatmap/HeatMapControls'
import HeatMapTable from '@/lib/features/heatmap/HeatMapTable'

export default function HeatMap() {
  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <HeatMapControls />
      
      {/* Heatmap Table */}
      <div className="flex-1">
        <HeatMapTable />
      </div>
    </div>
  )
}