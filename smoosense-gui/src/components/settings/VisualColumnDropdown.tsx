'use client'

import { useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch, useRenderType } from '@/lib/hooks'
import { setColumnForGalleryVisual } from '@/lib/features/ui/uiSlice'
import { isVisualType } from '@/lib/utils/renderTypeUtils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface VisualColumnDropdownProps {
  label?: string
}

export default function VisualColumnDropdown({
  label = 'Visual Column',
}: VisualColumnDropdownProps) {
  const dispatch = useAppDispatch()
  const value = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const renderTypeColumns = useRenderType()

  const availableColumns = (() => {
    if (!renderTypeColumns) return []

    return _.entries(renderTypeColumns)
      .filter(([, renderType]) => isVisualType(renderType))
      .map(([columnName]) => columnName)
  })()

  const handleChange = (newValue: string) => {
    dispatch(setColumnForGalleryVisual(newValue))
  }

  // Initialize with first available column if no value is set
  useEffect(() => {
    if (!value && availableColumns.length > 0) {
      dispatch(setColumnForGalleryVisual(availableColumns[0]))
    }
  }, [value, availableColumns, dispatch])

  // Only render if renderTypeColumns is available
  if (!renderTypeColumns || _.isEmpty(renderTypeColumns)) {
    return null
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[500px]">
      <label className="text-sm font-medium text-foreground text-right truncate">
        {label}
      </label>
      <div className="flex-1">
        <Select value={value || ''} onValueChange={handleChange}>
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
