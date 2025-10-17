import { useCallback, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useSingleColumnMeta } from '@/lib/hooks/useColumnMeta'
import { useIsCategorical } from '@/lib/hooks/useIsCategorical'
import {
  queryBaseColumnStats
} from '@/lib/features/colStats/colBaseStatsSlice'
import { 
  getCategoricalStats,
  getHistogramStats,
  getTextStats
} from '@/lib/features/colStats/statsUtils'
import { buildColStatsQueryFromState } from '@/lib/features/colStats/queryBuilders'
import { getFilterTypeFromState } from '@/lib/utils/state/filterUtils'
import { isValidColumnName, getSafeColumnName } from '@/lib/utils/columnNameUtils'
import type {
  CategoricalStats,
  HistogramStats,
  TextStats
} from '@/lib/features/colStats/types'

/**
 * Hook to get or query statistics for a specific column
 * Uses single column metadata and isCategorical to determine query type
 * 
 * @param columnName - The name of the column to get stats for
 * @returns Object with stats data, loading state, error, and query functions
 */
export function useColBaseStats(columnName: string) {
  const dispatch = useAppDispatch()

  // Sanitize column name for safe usage
  const safeColumnName = getSafeColumnName(columnName)
  const isValid = isValidColumnName(columnName)

  // Get current stats state for this column (use safeColumnName to avoid empty key issues)
  const columnState = useAppSelector((state) => state.columns.baseStats[safeColumnName])
  
  // Get dependencies
  const { columnMeta: currentColumnMeta, loading: metaLoading, filePath } = useSingleColumnMeta(columnName)
  const { isCategorical, loading: isCategoricalLoading, error: isCategoricalError } = useIsCategorical(columnName)

  // Derived state
  const data = columnState?.data || null
  const loading = columnState?.loading || false
  const error = columnState?.error || null
  const hasData = !!data

  // Calculate overall loading and error states
  const overallLoading = loading || metaLoading || isCategoricalLoading
  const overallError = error || isCategoricalError

  // Build query for this column (null filter for base stats)
  const query = useAppSelector((state) => {
    if (!filePath || !isValid) return null
    return buildColStatsQueryFromState({
      columnName,
      addFilter: false,
      state
    })
  })

  // Get filter type for query execution
  const filterType = useAppSelector((state) => isValid ? getFilterTypeFromState(columnName, state) : null)

  // Define condition for when we should fetch stats
  const shouldFetch = isValid &&
                      !hasData &&
                      !loading &&
                      !metaLoading &&
                      !isCategoricalLoading &&
                      !!currentColumnMeta &&
                      isCategorical !== null &&
                      !!filePath &&
                      !!query &&
                      !error  // Don't retry if there's any error

  // Auto-query stats when dependencies are ready
  useEffect(() => {
    if (shouldFetch && query && filterType !== null) {
      dispatch(queryBaseColumnStats({ 
        columnName, 
        sqlQuery: query, 
        filterType 
      }))
    }
  }, [shouldFetch, dispatch, columnName, query, filterType])



  // Type-safe getters for specific stats types
  const getCategoricalStatsCallback = useCallback((): CategoricalStats | null => {
    return getCategoricalStats(data)
  }, [data])

  const getHistogramStatsCallback = useCallback((): HistogramStats | null => {
    return getHistogramStats(data)
  }, [data])

  const getTextStatsCallback = useCallback((): TextStats | null => {
    return getTextStats(data)
  }, [data])

  return {
    // Core state
    data,
    loading: overallLoading,
    error: overallError,
    hasData,
    
    // Dependencies (shared with other hooks)
    columnMeta: currentColumnMeta,
    isCategorical,
    filePath,

    // Type-safe getters
    getCategoricalStats: getCategoricalStatsCallback,
    getHistogramStats: getHistogramStatsCallback,
    getTextStats: getTextStatsCallback,
  }
}

