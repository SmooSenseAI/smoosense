'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { ColumnFilter, NullFilterOption } from '@/lib/features/colDefs/agSlice'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { FilterType } from '@/lib/features/filters/types'
import NullFilterSection from './NullFilterSection'
import FilterBottomButtons from './FilterBottomButtons'
import FilterDebugSection from './FilterDebugSection'

/**
 * Creates a ColumnFilter for text filtering
 */
const createTextColumnFilter = (contains: string, nullFilter: NullFilterOption): ColumnFilter => {
  return {
    contains: contains,
    null: nullFilter,
    filterType: FilterType.TEXT
  }
}

interface TextFilterCardProps {
  columnName: string
  onClose?: () => void
}

export default function TextFilterCard({ columnName, onClose }: TextFilterCardProps) {
  const reduxFilter = useAppSelector(state => state.ag.filters[columnName])
  const dispatch = useAppDispatch()

  // Store individual filter states
  const [nullFilter, setNullFilter] = useState<NullFilterOption>(() => {
    return reduxFilter?.null || 'Include'
  })
  
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    return reduxFilter?.contains || ''
  })

  // Debounced search term for internal state management
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(searchTerm)

  // Debounce the search term updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  const applyTextFilter = useCallback((filter: ColumnFilter | undefined) => {
    dispatch(setColumnFilter({ columnName, filter }))
  }, [columnName, dispatch])

  const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const updateNullFilterOption = useCallback((nullValue: NullFilterOption) => {
    setNullFilter(nullValue)
  }, [])

  const resetTextFilterToOriginal = useCallback(() => {
    if (reduxFilter) {
      setNullFilter(reduxFilter.null || 'Include')
      setSearchTerm(reduxFilter.contains || '')
    } else {
      setNullFilter('Include')
      setSearchTerm('')
    }
  }, [reduxFilter])

  const applyTextFilterChanges = () => {
    if (!debouncedSearchTerm || !debouncedSearchTerm.trim()) {
      applyTextFilter(undefined)
    } else {
      const filter = createTextColumnFilter(debouncedSearchTerm.trim(), nullFilter)
      applyTextFilter(filter)
    }
  }

  return (
    <div className="min-w-[400px]">
      <div className="p-2 space-y-2">
        <NullFilterSection 
          columnName={columnName}
          value={nullFilter}
          onChange={updateNullFilterOption}
        />

        {/* Search Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Search Text
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchTermChange}
                placeholder="Enter search term..."
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <FilterDebugSection 
          columnName={columnName}
          filterData={createTextColumnFilter(debouncedSearchTerm.trim(), nullFilter)}
        />

        <FilterBottomButtons
          columnName={columnName}
          onCancelChanges={resetTextFilterToOriginal}
          onApply={applyTextFilterChanges}
          onClose={onClose}
        />
      </div>
    </div>
  )
}