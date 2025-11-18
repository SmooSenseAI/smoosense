'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { FilterType } from '@/lib/features/filters/types'

interface MiniTextFilterProps {
  columnName: string
  initialValue?: string
}

export default function MiniTextFilter({ columnName, initialValue = '' }: MiniTextFilterProps) {
  const [value, setValue] = useState(initialValue)
  const dispatch = useAppDispatch()
  
  // Get current filter from Redux state
  const currentFilter = useAppSelector((state) => state.ag.filters[columnName])
  
  // Initialize value from Redux state if filter exists
  useEffect(() => {
    if (currentFilter?.filterType === FilterType.TEXT && currentFilter.contains) {
      setValue(currentFilter.contains)
    } else if (!currentFilter) {
      setValue('')
    }
  }, [currentFilter])

  const applyFilter = useCallback(() => {
    if (value.trim()) {
      dispatch(setColumnFilter({
        columnName,
        filter: {
          null: 'Exclude',
          filterType: FilterType.TEXT,
          contains: value.trim()
        }
      }))
    } else {
      dispatch(setColumnFilter({
        columnName,
        filter: undefined
      }))
    }
  }, [columnName, value, dispatch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent parent button from capturing keyboard events
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      applyFilter()
    }
    // Prevent Space from triggering parent button
    if (e.key === ' ') {
      e.preventDefault()
      // Manually insert space into the input
      const target = e.target as HTMLInputElement
      const start = target.selectionStart || 0
      const end = target.selectionEnd || 0
      const newValue = value.substring(0, start) + ' ' + value.substring(end)
      setValue(newValue)
      // Set cursor position after the inserted space
      setTimeout(() => {
        target.setSelectionRange(start + 1, start + 1)
      }, 0)
    }
  }, [applyFilter, value])

  return (
    <div
      className="flex-1 h-full flex items-center px-1"
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={applyFilter}
        onClick={(e) => {
          e.stopPropagation()
        }}
        placeholder="Filter text..."
        className="w-full h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}