'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useRenderType } from '@/lib/hooks'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { setColumnForGalleryVisual, setColumnForGalleryCaption, setHistogramColumn, setBubblePlotXColumn, setBubblePlotYColumn, setHeatmapXColumn, setHeatmapYColumn } from '@/lib/features/ui/uiSlice'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ColumnDropdownProps {
  settingKey: keyof UIState
  label: string
  candidateRenderTypes: RenderType[] // Order matters - columns will appear in this order
}

type UIState = {
  columnForGalleryVisual: string
  columnForGalleryCaption: string
  histogramColumn: string
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  heatmapXColumn: string
  heatmapYColumn: string
}

const actionMap = {
  columnForGalleryVisual: setColumnForGalleryVisual,
  columnForGalleryCaption: setColumnForGalleryCaption,
  histogramColumn: setHistogramColumn,
  bubblePlotXColumn: setBubblePlotXColumn,
  bubblePlotYColumn: setBubblePlotYColumn,
  heatmapXColumn: setHeatmapXColumn,
  heatmapYColumn: setHeatmapYColumn,
} as const

export default function ColumnDropdown({ 
  settingKey, 
  label, 
  candidateRenderTypes
}: ColumnDropdownProps) {
  const dispatch = useAppDispatch()
  const renderTypeColumns = useRenderType()
  const currentValue = useAppSelector((state) => state.ui[settingKey])

  const availableColumns = (() => {
    if (!renderTypeColumns) return []
    
    // Group columns by render type and get them in candidateRenderTypes order
    const columnsByType = _.groupBy(
      Object.entries(renderTypeColumns).filter(([, renderType]) => 
        candidateRenderTypes.includes(renderType)
      ),
      ([, renderType]) => renderType
    )
    
    return _.flatMap(candidateRenderTypes, renderType => 
      _.map(columnsByType[renderType] || [], ([columnName]) => columnName)
    )
  })()

  const handleValueChange = (value: string) => {
    const action = actionMap[settingKey]
    if (action) {
      dispatch(action(value))
    }
  }

  // Initialize with first available column if no value is set and candidates exist
  useEffect(() => {
    if (!currentValue && availableColumns.length > 0) {
      const action = actionMap[settingKey]
      if (action) {
        dispatch(action(availableColumns[0]))
      }
    }
  }, [availableColumns, currentValue, settingKey, dispatch])

  // Only render if renderTypeColumns is available
  if (!renderTypeColumns || _.size(renderTypeColumns) === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[500px]">
      <label className="text-sm font-medium text-foreground text-right truncate">
        {label}
      </label>
      <div className="flex-1">
        <Select value={currentValue || ""} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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