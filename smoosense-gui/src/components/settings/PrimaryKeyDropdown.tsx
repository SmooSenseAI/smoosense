'use client'

import _ from 'lodash'
import { useAppSelector, useAppDispatch, useRenderType } from '@/lib/hooks'
import { setPrimaryKeyColumn } from '@/lib/features/ui/uiSlice'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PrimaryKeyDropdownProps {
  label?: string
}

/**
 * Check if a render type is suitable for a primary key (string or integer only)
 */
function isPrimaryKeyType(renderType: RenderType): boolean {
  return [RenderType.Text, RenderType.Number].includes(renderType)
}

export default function PrimaryKeyDropdown({
  label = 'Primary Key',
}: PrimaryKeyDropdownProps) {
  const dispatch = useAppDispatch()
  const value = useAppSelector((state) => state.ui.primaryKeyColumn)
  const pickedKeys = useAppSelector((state) => state.handPickedRows.pickedKeys)
  const renderTypeColumns = useRenderType()

  const availableColumns = (() => {
    if (!renderTypeColumns) return []

    return _.entries(renderTypeColumns)
      .filter(([, renderType]) => isPrimaryKeyType(renderType))
      .map(([columnName]) => columnName)
  })()

  const handleChange = (newValue: string) => {
    dispatch(setPrimaryKeyColumn(newValue))
  }

  // Only render if renderTypeColumns is available
  if (!renderTypeColumns || _.isEmpty(renderTypeColumns)) {
    return null
  }

  // Lock selection once rows have been picked
  const isLocked = pickedKeys.length > 0

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[500px]">
      <label className="text-sm font-medium text-foreground text-right truncate">
        {label}
      </label>
      <div className="flex-1">
        <Select
          value={value || ''}
          onValueChange={handleChange}
          disabled={isLocked}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a column" />
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
