'use client'

import React, { memo, useCallback } from 'react'
import HorizontalBoxPlot from '@/components/common/HorizontalBoxPlot'
import CellPopover from '@/components/ui/CellPopover'
import JsonBox from '@/components/ui/JsonBox'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import { setNeedRefresh } from '@/lib/features/rowData/rowDataSlice'
import { sanitizeName, sanitizeValue } from '@/lib/utils/sql/helpers'

interface BoxPlotCellRendererProps {
  value: {
    min: number
    max: number
    avg: number
    q25: number
    q50: number
    q75: number
    std: number
    skewness: number
  }
  columnName?: string
  breakdownName?: string
  breakdownValue?: string | null
}

const BoxPlotCellRenderer = memo(function BoxPlotCellRenderer({ 
  value,
  columnName,
  breakdownName,
  breakdownValue
}: BoxPlotCellRendererProps) {
  const dispatch = useAppDispatch()
  const rowHeight = 32
  const tableCellSpacing = useAppSelector((state) => state.ui.tableCellSpacing)

  const handleSampleClick = useCallback((left: keyof typeof value, right: keyof typeof value) => {
    if (!columnName || !value[left] || !value[right]) return
    
    // Build range condition
    const rangeCondition = `${sanitizeName(columnName)} >= ${value[left]} AND ${sanitizeName(columnName)} <= ${value[right]}`
    
    // Build breakdown condition if applicable
    let condExpr = rangeCondition
    if (breakdownName && breakdownValue) {
      const breakdownCondition = `${sanitizeName(breakdownName)} = ${sanitizeValue(breakdownValue)}`
      condExpr = `(${breakdownCondition}) AND (${rangeCondition})`
    }
    
    dispatch(setSamplingCondition(condExpr))
    dispatch(setNeedRefresh(true))
  }, [dispatch, columnName, breakdownName, breakdownValue, value])

  const sampleButton = useCallback((left: keyof typeof value, right: keyof typeof value, label: string) => (
    <Button
      key={`${left}-${right}`}
      variant="outline"
      size="sm"
      onClick={() => handleSampleClick(left, right)}
      className="text-xs"
    >
      {label}
    </Button>
  ), [handleSampleClick])

  if (!value || typeof value !== 'object') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No data
      </div>
    )
  }

  const plot = (
    <div
      className="flex items-center justify-center"
      style={{ 
        maxHeight: `${rowHeight}px`, 
        padding: `${tableCellSpacing}px` 
      }}
    >
      <HorizontalBoxPlot data={value} width={200} />
    </div>
  )

  const popoverContent = (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="space-y-1">
        <h4 className="font-medium">{columnName}</h4>
        {breakdownName && breakdownValue && (
          <p className="text-sm text-muted-foreground">
            {breakdownName} = {breakdownValue}
          </p>
        )}
      </div>

      {/* Sample buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sample data ranges:</p>
        <div className="flex flex-wrap gap-2">
          {sampleButton('min', 'q25', 'Min to Q25')}
          {sampleButton('q25', 'q50', 'Q25 to Q50')}
          {sampleButton('q50', 'q75', 'Q50 to Q75')}
          {sampleButton('q75', 'max', 'Q75 to Max')}
        </div>
      </div>

      {/* JSON data */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Statistics:</p>
        <JsonBox 
          src={value}
          showControls={false}
          className="flex-1 overflow-auto"
        />
      </div>
    </div>
  )

  return (
    <CellPopover
      cellContent={plot}
      popoverContent={popoverContent}
      popoverClassName="w-110 h-120 p-0"
      copyValue={JSON.stringify(value)}
    />
  )
})

export default BoxPlotCellRenderer