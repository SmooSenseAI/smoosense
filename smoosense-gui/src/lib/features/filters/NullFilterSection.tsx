'use client'

import React from 'react'
import { useColFilteredStats, useSingleColumnMeta } from '@/lib/hooks'
import NullPie from '@/components/charts/NullPie'
import type { NullFilterOption } from '@/lib/features/colDefs/agSlice'

interface NullFilterProps {
  columnName: string
  value: NullFilterOption
  onChange: (value: NullFilterOption) => void
}

function NullFilterSection({
  columnName,
  value,
  onChange
}: NullFilterProps) {
  const colStats = useColFilteredStats(columnName)
  const { columnMeta } = useSingleColumnMeta(columnName)
  
  // Extract data from colStats
  const statsData = colStats.data

  // Extract null counts
  const cntNull = statsData && 'cnt_null' in statsData ? statsData.cnt_null : 0
  const cntNotNull = statsData && 'cnt_not_null' in statsData ? statsData.cnt_not_null : 0
  const cntAll = cntNull + cntNotNull

  // Determine if we should show null filter controls based on column metadata
  const hasNull = columnMeta?.stats?.hasNull
  const allNull = columnMeta?.stats?.allNull
  const showRadioGroup = hasNull && !allNull
  

  const nullPercentage = ((cntNull / cntAll) * 100).toFixed(1);
  const notNullPercentage = ((cntNotNull / cntAll) * 100).toFixed(1);


  return (
    <div className="flex items-center gap-6 border">
      <div className="flex items-center gap-1 rounded p-1">
        <div className="flex-shrink-0">
          <NullPie 
            cntNull={cntNull}
            cntNotNull={cntNotNull}
          />
        </div>
        <div className="flex flex-col gap-1">
          {cntNull > 0 && (
            <div className="rounded p-1 flex items-center gap-1">
              {cntNotNull > 0 && <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-warning-fill)' }}></div>}
              <span>Null: {nullPercentage}%</span>
            </div>
          )}
          {cntNotNull > 0 && (
            <div className="rounded p-1 flex items-center gap-1">
              {cntNull > 0 && <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--chart-default-fill)'}}></div>}
              <span>Not null: {notNullPercentage}%</span>
            </div>
          )}
        </div>
      </div>

        <div className="flex flex-col gap-2">
          {showRadioGroup && (<>
          <div className="text-muted-foreground mb-1">How to filter NULL values?</div>
          <div className="flex gap-4">

                {(['Include', 'Exclude', 'Only Null'] as const).map(option => (
                  <label key={option} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="nullFilter"
                      value={option}
                      checked={option === value}
                      onChange={(e) => onChange(e.target.value as NullFilterOption)}
                      className="w-3 h-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
          </div>
          </>)}
          {!hasNull && (<div className="text-muted-foreground">No value is null</div>)}
          {allNull && (<div className="text-muted-foreground">All values are null</div>)}
        </div>

    </div>
  )
}

export default React.memo(NullFilterSection)