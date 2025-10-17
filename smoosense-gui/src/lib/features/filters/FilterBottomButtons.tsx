'use client'

import { useCallback } from 'react'
import { useAppDispatch } from '@/lib/hooks'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { setIsCategorical } from '@/lib/features/isCategorical/isCategoricalSlice'
import { clearBaseColumnStats } from '@/lib/features/colStats/colBaseStatsSlice'
import { clearFilteredColumnStats } from '@/lib/features/colStats/colFilteredStatsSlice'
import { useIsCategorical } from '@/lib/hooks/useIsCategorical'
import { Switch } from '@/components/ui/switch'
import { CLS } from '@/lib/utils/styles'

interface FilterBottomButtonsProps {
  columnName: string
  onCancelChanges: () => void
  onApply: () => void
  onClose?: () => void
}

export default function FilterBottomButtons({
  columnName,
  onCancelChanges,
  onApply,
  onClose
}: FilterBottomButtonsProps) {
  const dispatch = useAppDispatch()
  const { isCategorical } = useIsCategorical(columnName)

  const handleRemoveFilter = useCallback(() => {
    dispatch(setColumnFilter({ columnName, filter: undefined }))
    onClose?.()
  }, [columnName, dispatch, onClose])

  const handleToggleCategorical = useCallback(() => {
    // Clear baseline and filtered stats for this column
    dispatch(clearBaseColumnStats(columnName))
    dispatch(clearFilteredColumnStats(columnName))
    
    // Remove any existing filter for this column
    dispatch(setColumnFilter({ columnName, filter: undefined }))
    
    // Toggle the categorical setting
    dispatch(setIsCategorical({ 
      columnName, 
      isCategorical: !isCategorical 
    }))
  }, [columnName, dispatch, isCategorical])
  
  return (
    <div className="flex justify-between pt-2">
      <div className="flex gap-2">
        <button
          onClick={handleRemoveFilter}
          className={CLS.BUTTON_DESTRUCTIVE}
        >
          Remove Filter
        </button>
        <button
          onClick={onCancelChanges}
          className={CLS.BUTTON_SECONDARY}
        >
          Cancel Changes
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="categorical-toggle" className="text-sm font-medium">
            Categorical
          </label>
          <Switch
            id="categorical-toggle"
            checked={isCategorical === true}
            onCheckedChange={handleToggleCategorical}
          />
        </div>
        <button
          onClick={() => {
            onApply()
            onClose?.()
          }}
          className={CLS.BUTTON_PRIMARY}
        >
          Apply
        </button>
    </div>
    </div>
  )
}