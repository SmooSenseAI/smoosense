'use client'

import { useState, useCallback } from 'react'
import { useColFilteredStats, useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { ColumnFilter, NullFilterOption } from '@/lib/features/colDefs/agSlice'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { FilterType } from '@/lib/features/filters/types'
import { HistogramCntValue } from '@/lib/features/colStats/types'
import NullFilterSection from '../NullFilterSection'
import RangeFilterSection from './RangeFilterSection'
import FilterBottomButtons from '../FilterBottomButtons'
import FilterDebugSection from '../FilterDebugSection'
import FilterCardWrapper from '../FilterCardWrapper'

/**
 * Creates a ColumnFilter for range filtering
 */
const createRangeColumnFilter = (range: number[] | undefined, nullFilter: NullFilterOption): ColumnFilter => {
  return {
    range: range,
    null: nullFilter,
    filterType: FilterType.RANGE
  }
}


interface RangeFilterCardProps {
  columnName: string
  onClose?: () => void
}

export default function RangeFilterCard({ columnName, onClose }: RangeFilterCardProps) {
  const colStats = useColFilteredStats(columnName)
  const reduxFilter = useAppSelector(state => state.ag.filters[columnName])
  const dispatch = useAppDispatch()
  
  // Check if the filter is active
  const isActive = reduxFilter != null

  // Extract data from colStats using type-safe getters
  const statsError = colStats.error
  const hasStatsData = colStats.hasData
  const isStatsLoading = colStats.loading

  // Use type-safe getter for histogram stats only
  const histogramStats = colStats.getHistogramStats()
  const chartData = histogramStats?.cnt_values || null
  const cntAll = histogramStats?.cnt_all || 0

  // Store individual filter states
  const [nullFilter, setNullFilter] = useState<NullFilterOption>(() => {
    return reduxFilter?.null || 'Include'
  })
  const [range, setRange] = useState<number[] | undefined>(() => {
    return reduxFilter?.range
  })

  const applyRangeFilter = useCallback((filter: ColumnFilter | undefined) => {
    dispatch(setColumnFilter({ columnName, filter }))
  }, [columnName, dispatch])

  const updateRangeFilterData = useCallback((newRange: number[]) => {
    setRange(newRange)
  }, [])

  const updateNullFilterOption = useCallback((nullValue: NullFilterOption) => {
    setNullFilter(nullValue)
  }, [])

  const resetRangeFilterToOriginal = useCallback(() => {
    if (reduxFilter) {
      setNullFilter(reduxFilter.null || 'Include')
      setRange(reduxFilter.range)
    } else {
      setNullFilter('Include')
      setRange(undefined)
    }
  }, [reduxFilter])

  const applyRangeFilterChanges = () => {
    if (range && range.length > 0) {
      const filter = createRangeColumnFilter(range, nullFilter)
      applyRangeFilter(filter)
    } else {
      // No range selected means no filter
      applyRangeFilter(undefined)
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

        <RangeFilterSection
          data={chartData as HistogramCntValue[]}
          cntAll={cntAll}
          nullFilterOption={nullFilter}
          onNullFilterChange={updateNullFilterOption}
          onRangeUpdate={updateRangeFilterData}
          range={range}
          isActive={isActive}
        />

        <FilterDebugSection 
          columnName={columnName}
          filterData={createRangeColumnFilter(range, nullFilter)}
        />

        <FilterBottomButtons
          columnName={columnName}
          onCancelChanges={resetRangeFilterToOriginal}
          onApply={applyRangeFilterChanges}
          onClose={onClose}
        />
      </div>
    </FilterCardWrapper>
  )
}