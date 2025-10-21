import { useCallback, useEffect } from 'react'
import {useAppDispatch, useAppSelector} from '@/lib/hooks'
import { useColBaseStats } from './useColBaseStats'
import { 
  queryFilteredColumnStats,
  setFilteredColumnStats
} from '@/lib/features/colStats/colFilteredStatsSlice'
import { 
  getCategoricalStats,
  getHistogramStats,
  getTextStats
} from '@/lib/features/colStats/statsUtils'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { buildColStatsQueryFromState } from '@/lib/features/colStats/queryBuilders'
import { getFilterTypeFromState } from '@/lib/utils/state/filterUtils'
import { isValidColumnName, getSafeColumnName } from '@/lib/utils/columnNameUtils'
import { isNil } from 'lodash'
import type {
  CategoricalStats,
  HistogramStats,
  TextStats
} from '@/lib/features/colStats/types'

/**
 * Hook to get or query filtered statistics for a specific column
 * Uses single column metadata and isCategorical to determine query type
 * Depends on useColBaseStats - if no filters are active, copies results from base stats
 * 
 * @param columnName - The name of the column to get filtered stats for
 * @returns Object with filtered stats data, loading state, error, and query functions
 */
export function useColFilteredStats(columnName: string) {
  const dispatch = useAppDispatch()

  // Sanitize column name for safe usage
  const safeColumnName = getSafeColumnName(columnName)
  const isValid = isValidColumnName(columnName)

  // Get base stats and all shared dependencies
  const baseStats = useColBaseStats(columnName)
  const {tablePath, columnMeta, isCategorical, loading: baseLoading, error: baseError } = baseStats
  
  // Get current filtered stats state for this column (use safeColumnName to avoid empty key issues)
  const columnState = useAppSelector((state) => state.columns.filteredStats[safeColumnName])
  
  // Get current filter condition to determine if we need filtered stats
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  const hasActiveFilters = !isNil(filterCondition)

  // Build query for this column (with filter if active)
  const query = useAppSelector((state) => {
    if (!tablePath || !isValid) return null
    return buildColStatsQueryFromState({ 
      columnName, 
      addFilter: hasActiveFilters, 
      state 
    })
  })

  // Get filter type for query execution
  const filterType = useAppSelector((state) => isValid ? getFilterTypeFromState(columnName, state) : null)

  // Derived state for filtered stats
  const data = columnState?.data || null
  const loading = columnState?.loading || false
  const error = columnState?.error || null
  const hasData = !!data

  // Calculate overall loading and error states including base stats
  const overallLoading = loading || baseLoading
  const overallError = error || baseError

  // Define conditions for different actions
  const shouldCopyBaseToFiltered = !hasActiveFilters && !hasData && baseStats.data
  const shouldFetchFiltered = hasActiveFilters &&
                             !hasData &&
                             !loading &&
                             !baseLoading &&
                             !!columnMeta &&
                             isCategorical !== null &&
                             !!tablePath &&
                             !!query &&
                             !error  // Don't retry if there's any error

  // Copy base stats to filtered slice when filters become active, or query if filters change
  useEffect(() => {
    // Wait for base stats to be available (we depend on them)
    if (!baseStats.hasData) {
      return
    }

    // If no filters are active, copy base stats to filtered slice for consistency
    if (shouldCopyBaseToFiltered && baseStats.data) {
      dispatch(setFilteredColumnStats({ 
        columnName, 
        stats: baseStats.data 
      }))
      return
    }

    // All dependencies ready and filters are active - query filtered stats  
    if (shouldFetchFiltered && filterType !== null) {
      dispatch(queryFilteredColumnStats({ 
        columnName, 
        sqlQuery: query, 
        filterType 
      }))
    }
  }, [shouldCopyBaseToFiltered, shouldFetchFiltered, baseStats.hasData, baseStats.data, dispatch, columnName, query, filterType])


  // Type-safe getters - only return filtered slice data
  const getCategoricalStatsCallback = useCallback((): CategoricalStats | null => {
    return getCategoricalStats(data)
  }, [data])

  const getHistogramStatsCallback = useCallback((): HistogramStats | null => {
    return getHistogramStats(data)
  }, [data])

  const getTextStatsCallback = useCallback((): TextStats | null => {
    return getTextStats(data)
  }, [data])

  // Always return from filtered slice since we populate it for consistency
  // If no filters and no filtered data yet, fall back to base stats temporarily
  const effectiveData = hasData ? data : (!hasActiveFilters ? baseStats.data : data)
  const effectiveHasData = hasData ? hasData : (!hasActiveFilters ? baseStats.hasData : hasData)

  return {
    // Core state - primarily from filtered slice with base stats fallback
    data: effectiveData,
    loading: overallLoading,
    error: overallError,
    hasData: effectiveHasData,
    
    // Dependencies (shared from baseStats)
    columnMeta,
    isCategorical,
    tablePath,
    
    // Filter information
    hasActiveFilters,
    filterCondition,
    
    // Type-safe getters (return filtered slice data only)
    getCategoricalStats: getCategoricalStatsCallback,
    getHistogramStats: getHistogramStatsCallback,
    getTextStats: getTextStatsCallback,
  }
}