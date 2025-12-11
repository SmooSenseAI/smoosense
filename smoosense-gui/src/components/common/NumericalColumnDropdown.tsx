'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useIsCategoricalBulk } from '@/lib/hooks/useIsCategorical'
import { useRenderType } from '@/lib/hooks/useRenderType'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { setHistogramColumn, setBubblePlotXColumn, setBubblePlotYColumn, setBubblePlotColorColumn } from '@/lib/features/ui/uiSlice'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ExtraOption {
  value: string
  label: string
}

interface NumericalColumnDropdownProps {
  settingKey: keyof UIState
  label: string
  shouldInitialize?: boolean
  showStats?: boolean
  extraOptions?: ExtraOption[]
}

type UIState = {
  histogramColumn: string
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  bubblePlotColorColumn: string
}

const actionMap = {
  histogramColumn: setHistogramColumn,
  bubblePlotXColumn: setBubblePlotXColumn,
  bubblePlotYColumn: setBubblePlotYColumn,
  bubblePlotColorColumn: setBubblePlotColorColumn,
} as const

export default function NumericalColumnDropdown({
  settingKey,
  label,
  shouldInitialize = true,
  showStats = false,
  extraOptions = []
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
      // Convert "-" back to empty string
      dispatch(action(value === "-" ? "" : value))
    }
  }

  // Auto-initialize:
  // - If shouldInitialize is true, initialize to first available column
  // - If extraOptions is provided, initialize to first extraOption
  useEffect(() => {
    if (!currentValue) {
      const action = actionMap[settingKey]
      if (action) {
        if (shouldInitialize && availableColumns.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dispatch((action as any)(availableColumns[0]))
        } else if (extraOptions.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dispatch((action as any)(extraOptions[0].value))
        }
      }
    }
  }, [shouldInitialize, availableColumns, currentValue, settingKey, dispatch, extraOptions])

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
      {showStats && currentValue && (
        <div className="h-10 w-16">
          <HeaderStatsCellRendererImpl columnName={currentValue} side="bottom" showNullPie={false} />
        </div>
      )}
      <div className='flex-1'>
        <Select
          value={currentValue === "" ? "-" : currentValue}
          onValueChange={handleValueChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholderText}>
              {/* Show label for extra options, otherwise show value */}
              {extraOptions.find(opt => opt.value === currentValue)?.label ?? (currentValue === "" ? "-" : currentValue)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Null option */}
            <SelectItem value="-">-</SelectItem>
            {/* Extra options */}
            {extraOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
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