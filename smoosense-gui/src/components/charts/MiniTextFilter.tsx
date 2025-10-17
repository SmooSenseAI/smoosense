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

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyFilter()
    }
  }, [applyFilter])

  return (
    <div className="flex-1 h-full flex items-center px-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onBlur={applyFilter}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        placeholder="Filter text..."
        className="w-full h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}