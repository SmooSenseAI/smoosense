'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useRenderType } from '@/lib/hooks'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { setBoxPlotColumns } from '@/lib/features/ui/uiSlice'
import { MultiSelect } from '@/components/ui/multi-select'

interface MultiSelectColumnDropdownProps {
  settingKey: 'boxPlotColumns'
  label: string
  candidateRenderTypes: RenderType[]
  shouldInitialize?: boolean
}

const actionMap = {
  boxPlotColumns: setBoxPlotColumns,
} as const

export default function MultiSelectColumnDropdown({ 
  settingKey, 
  label, 
  candidateRenderTypes,
  shouldInitialize = false
}: MultiSelectColumnDropdownProps) {
  const dispatch = useAppDispatch()
  const renderTypeColumns = useRenderType()
  const currentValue = useAppSelector((state) => state.ui[settingKey])

  const availableColumns = (() => {
    if (!renderTypeColumns) return []
    
    return _(renderTypeColumns)
      .toPairs()
      .filter(([, renderType]) => candidateRenderTypes.includes(renderType as RenderType))
      .map(([columnName]) => columnName)
      .value()
  })()

  const handleValueChange = (newValues: string[]) => {
    const action = actionMap[settingKey]
    if (action) {
      dispatch(action(newValues))
    }
  }

  // Auto-initialize if shouldInitialize is true
  useEffect(() => {
    if (shouldInitialize && availableColumns.length > 0 && currentValue.length === 0) {
      const action = actionMap[settingKey]
      if (action) {
        // Initialize with first column
        dispatch(action([availableColumns[0]]))
      }
    }
  }, [shouldInitialize, availableColumns, currentValue.length, settingKey, dispatch])

  const getPlaceholderText = () => {
    if (!renderTypeColumns) {
      return "Loading columns..."
    }
    if (availableColumns.length === 0) {
      return "No numeric columns available"
    }
    return "Select columns..."
  }

  const options = availableColumns.map(column => ({
    label: column,
    value: column
  }))

  const isDisabled = !renderTypeColumns || availableColumns.length === 0

  return (
    <div className="flex gap-3 items-center w-full">
      <label className="text-sm font-medium text-foreground truncate min-w-[100px]">
        {label}
      </label>
      
      <MultiSelect
        options={options}
        onValueChange={handleValueChange}
        value={currentValue}
        placeholder={getPlaceholderText()}
        disabled={isDisabled}
        className="flex-1"
        maxCount={3}
      />
    </div>
  )
}