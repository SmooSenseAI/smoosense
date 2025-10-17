'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useIsCategoricalBulk } from '@/lib/hooks/useIsCategorical'
import { useRenderType } from '@/lib/hooks/useRenderType'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { setHistogramColumn, setBubblePlotXColumn, setBubblePlotYColumn } from '@/lib/features/ui/uiSlice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NumericalColumnDropdownProps {
  settingKey: keyof UIState
  label: string
  shouldInitialize?: boolean
}

type UIState = {
  histogramColumn: string
  bubblePlotXColumn: string
  bubblePlotYColumn: string
}

const actionMap = {
  histogramColumn: setHistogramColumn,
  bubblePlotXColumn: setBubblePlotXColumn,
  bubblePlotYColumn: setBubblePlotYColumn,
} as const

export default function NumericalColumnDropdown({
  settingKey,
  label,
  shouldInitialize = true
}: NumericalColumnDropdownProps) {
  const dispatch = useAppDispatch()
  const { isCategoricalColumns } = useIsCategoricalBulk()
  const renderTypes = useRenderType()
  const currentValue = useAppSelector((state) => state.ui[settingKey])

  const availableColumns = (() => {
    if (!isCategoricalColumns || !renderTypes) return []

    // Filter columns where renderType is 'Number' and isCategorical is false
    return Object.entries(renderTypes)
      .filter(([columnName, renderType]) => {
        const isCategorical = isCategoricalColumns[columnName]
        return renderType === RenderType.Number && isCategorical === false
      })
      .map(([columnName]) => columnName)
  })()

  const handleValueChange = (value: string) => {
    const action = actionMap[settingKey]
    if (action) {
      // Convert "-" back to empty string (numerical columns don't accept null)
      dispatch(action(value === "-" ? "" : value))
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
    if (!isCategoricalColumns || !renderTypes) {
      return "Loading columns..."
    }
    if (_.size(renderTypes) === 0) {
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
          value={currentValue === "" ? "-" : currentValue}
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