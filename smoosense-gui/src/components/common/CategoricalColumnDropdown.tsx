'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useIsCategoricalBulk } from '@/lib/hooks/useIsCategorical'
import { setHistogramBreakdownColumn, setBubblePlotBreakdownColumn, setHeatmapXColumn, setHeatmapYColumn, setBoxPlotBreakdownColumn } from '@/lib/features/ui/uiSlice'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CategoricalColumnDropdownProps {
  settingKey: keyof UIState
  label: string
  shouldInitialize?: boolean
}

type UIState = {
  histogramBreakdownColumn: string | null
  bubblePlotBreakdownColumn: string | null
  heatmapXColumn: string | null
  heatmapYColumn: string | null
  boxPlotBreakdownColumn: string | null
}

const actionMap = {
  histogramBreakdownColumn: setHistogramBreakdownColumn,
  bubblePlotBreakdownColumn: setBubblePlotBreakdownColumn,
  heatmapXColumn: setHeatmapXColumn,
  heatmapYColumn: setHeatmapYColumn,
  boxPlotBreakdownColumn: setBoxPlotBreakdownColumn,
} as const

export default function CategoricalColumnDropdown({ 
  settingKey, 
  label,
  shouldInitialize = false
}: CategoricalColumnDropdownProps) {
  const dispatch = useAppDispatch()
  const { isCategoricalColumns } = useIsCategoricalBulk()
  const currentValue = useAppSelector((state) => state.ui[settingKey])

  const availableColumns = (() => {
    if (!isCategoricalColumns) return []
    
    // Filter columns where isCategorical is true
    return Object.entries(isCategoricalColumns)
      .filter(([, isCategorical]) => isCategorical === true)
      .map(([columnName]) => columnName)
  })()

  const handleValueChange = (value: string) => {
    const action = actionMap[settingKey]
    if (action) {
      // Convert "-" back to null
      dispatch(action(value === "-" ? null : value))
    }
  }

  // Auto-initialize if shouldInitialize is true
  useEffect(() => {
    if (shouldInitialize && availableColumns.length > 0 && !currentValue) {
      const action = actionMap[settingKey]
      if (action) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dispatch((action as any)(availableColumns[0]))
      }
    }
  }, [shouldInitialize, availableColumns, currentValue, settingKey, dispatch])

  const getPlaceholderText = () => {
    if (!isCategoricalColumns) {
      return "Loading columns..."
    }
    if (_.size(isCategoricalColumns) === 0) {
      return "No columns analyzed yet"
    }
    return undefined
  }

  const placeholderText = getPlaceholderText()
  const isDisabled = !!placeholderText

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[500px]">
      <label className="text-sm font-medium text-foreground truncate">
        {label}
      </label>
      <div className='flex-1'>
        <Select
          value={currentValue === null ? "-" : (currentValue || "")}
          onValueChange={handleValueChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholderText} />
          </SelectTrigger>
          <SelectContent>
            {/* Null option */}
            <SelectItem value="-">-</SelectItem>
            {availableColumns.map((column) => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}