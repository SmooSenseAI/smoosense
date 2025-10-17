'use client'

import React, { useCallback } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { TreeMapCustomizedContent } from '@/components/charts/TreeMapContent'
import type { NullFilterOption } from '@/lib/features/colDefs/agSlice'
import type { CategoricalCntValue } from '@/lib/features/colStats/types'
import isNil from 'lodash/isNil'

interface EnumFilterTreeMapProps {
  data: CategoricalCntValue[]
  cntAll: number
  /** Current null filter setting */
  nullFilterOption: NullFilterOption
  /** Callback to change null filter option, triggered automatically on TreeMap click if currently 'Include' */
  onNullFilterChange: (value: NullFilterOption) => void
  /** Callback fired when user clicks a TreeMap segment, with the clicked enum value */
  onValueClick: (value: string) => void
  /** Whether the filter is active (affects color) */
  isActive?: boolean
}

const EnumFilterTreeMap = React.memo(function EnumFilterTreeMap({
  data,
  cntAll,
  nullFilterOption,
  onNullFilterChange,
  onValueClick,
  isActive = false
}: EnumFilterTreeMapProps) {
  
  const handleTreeMapClick = useCallback((clickData: { name?: string }) => {
    if (clickData && !isNil(clickData.name)) {
      const clickedValue = String(clickData.name)
      
      // Auto-change null to "exclude" when enum values are selected
      if (nullFilterOption === 'Include') {
        onNullFilterChange('Exclude')
      }
      
      onValueClick(clickedValue)
    }
  }, [nullFilterOption, onNullFilterChange, onValueClick])

  return (
    <div className="border rounded p-0 w-full h-[100px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="cnt"
          nameKey="value"
          fill={isActive ? "var(--chart-active-fill)" : "var(--chart-default-fill)"}
          content={<TreeMapCustomizedContent isActive={isActive} />}
          isAnimationActive={false}
          onClick={handleTreeMapClick}
        >
          <Tooltip
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                const percentage = ((data.cnt / cntAll) * 100).toFixed(1);
                return (
                  <div className="bg-background border rounded p-2 shadow-md text-sm">
                    <div className="font-medium">{data.name}</div>
                    <div className="text-muted-foreground">Count: {data.cnt}</div>
                    <div className="text-muted-foreground">Percentage: {percentage}%</div>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
})

export default EnumFilterTreeMap