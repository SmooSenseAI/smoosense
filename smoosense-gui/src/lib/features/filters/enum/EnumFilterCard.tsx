'use client'

import { useState, useCallback, useMemo } from 'react'
import { useColFilteredStats, useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { ColumnFilter, NullFilterOption } from '@/lib/features/colDefs/agSlice'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { FilterType } from '@/lib/features/filters/types'
import _ from 'lodash'
import NullFilterSection from '../NullFilterSection'
import EnumFilterTreeMap from './EnumFilterTreeMap'
import EnumFilterTable from './EnumFilterTable'
import FilterBottomButtons from '../FilterBottomButtons'
import FilterDebugSection from '../FilterDebugSection'
import FilterCardWrapper from '../FilterCardWrapper'

/**
 * Creates a ColumnFilter for enum filtering
 */
const createEnumColumnFilter = (including: string[], nullFilter: NullFilterOption): ColumnFilter => {
  return {
    including: including,
    null: nullFilter,
    filterType: FilterType.ENUM
  }
}


interface EnumFilterCardProps {
  columnName: string
  onClose?: () => void
}

export default function EnumFilterCard({ columnName, onClose }: EnumFilterCardProps) {
  const colStats = useColFilteredStats(columnName)
  const reduxFilter = useAppSelector(state => state.ag.filters[columnName])
  const dispatch = useAppDispatch()
  
  // Check if the filter is active
  const isActive = reduxFilter != null

  // Extract data from colStats using type-safe getters
  const statsError = colStats.error
  const hasStatsData = colStats.hasData
  const isStatsLoading = colStats.loading

  // Use type-safe getter for categorical stats only
  const categoricalStats = colStats.getCategoricalStats()
  const allOptions = useMemo(() => 
    _.map(categoricalStats?.cnt_values || [], item => String(item.value)), 
    [categoricalStats?.cnt_values]
  )

  // Extract chart data from categorical stats
  const chartData = useMemo(() => 
    categoricalStats?.cnt_values || null, 
    [categoricalStats?.cnt_values]
  )
  const cntAll = categoricalStats?.cnt_all || 0

  // Store individual filter states
  const [nullFilter, setNullFilter] = useState<NullFilterOption>(() => {
    return reduxFilter?.null || 'Include'
  })
  const [including, setIncluding] = useState<string[]>(() => {
    if (reduxFilter?.including) {
      return reduxFilter.including
    }
    // Default to all values if chart data is available
    return allOptions
  })




  const updateNullFilterOption = useCallback((nullValue: NullFilterOption) => {
    setNullFilter(nullValue)
  }, [])

  // Handlers merged from EnumFilterSection
  const handleTreeMapValueClick = useCallback((value: string) => {
    // Select only the clicked item
    setIncluding([value])
  }, [])

  const handleTableSelectionChange = useCallback((selectedRowValues: string[]) => {
    setIncluding(selectedRowValues)
  }, [])

  const resetEnumFilterToOriginal = useCallback(() => {
    if (reduxFilter) {
      setNullFilter(reduxFilter.null || 'Include')
      setIncluding(reduxFilter.including || allOptions)
    } else {
      setNullFilter('Include')
      setIncluding(allOptions)
    }
  }, [reduxFilter, allOptions])


  const applyEnumFilter = () => {
    if (including.length === 0) {
      // No values selected means no filter
      dispatch(setColumnFilter({ columnName, filter: undefined }))
    } else {
      // If all values are selected and null filter is include, remove filter (means all included)
      if (chartData && including.length === chartData.length && nullFilter === 'Include') {
        dispatch(setColumnFilter({ columnName, filter: undefined }))
      } else {
        const filter = createEnumColumnFilter(including, nullFilter)
        dispatch(setColumnFilter({ columnName, filter }))
      }
    }
  }
  return (
    <FilterCardWrapper
      columnName={columnName}
      isLoading={isStatsLoading}
      error={statsError}
      hasData={hasStatsData && !!chartData}
    >
      <div className="p-2 space-y-2">
        <NullFilterSection 
          columnName={columnName}
          value={nullFilter}
          onChange={updateNullFilterOption}
        />

        <div className="space-y-4">
          <EnumFilterTreeMap
            data={chartData!}
            cntAll={cntAll}
            nullFilterOption={nullFilter}
            onNullFilterChange={updateNullFilterOption}
            onValueClick={handleTreeMapValueClick}
            isActive={isActive}
          />

          <EnumFilterTable
            data={chartData!}
            cntAll={cntAll}
            selectedValues={including}
            onSelectionChange={handleTableSelectionChange}
          />
        </div>

        <FilterDebugSection 
          columnName={columnName}
          filterData={createEnumColumnFilter(including, nullFilter)}
        />

        <FilterBottomButtons
          columnName={columnName}
          onCancelChanges={resetEnumFilterToOriginal}
          onApply={applyEnumFilter}
          onClose={onClose}
        />
      </div>
    </FilterCardWrapper>
  )
}