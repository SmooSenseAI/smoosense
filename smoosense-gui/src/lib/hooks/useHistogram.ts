import { useAppSelector } from '@/lib/hooks'
import { fetchHistogram, setNeedRefresh as setNeedRefreshAction, type HistogramGroup } from '@/lib/features/histogram/histogramSlice'
import { useAsyncData } from './useAsyncData'
import { useColFilteredStats } from './useColFilteredStats'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { useMemo } from 'react'

interface UseHistogramResult {
  data: HistogramGroup[]
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

/**
 * Hook to get histogram chart data
 * Depends on histogram column selection and histogram stats
 */
export function useHistogram(): UseHistogramResult {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const histogramColumn = useAppSelector((state) => state.ui.histogramColumn)
  const histogramBreakdownColumn = useAppSelector((state) => state.ui.histogramBreakdownColumn)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  
  // Get histogram stats for the selected column
  const { data: histogramStatsData, loading: statsLoading, error: statsError } = useColFilteredStats(histogramColumn)
  
  // Build parameters for histogram fetching
  const params = useMemo(() => {
    if (!tablePath || !histogramColumn || !histogramStatsData) {
      return null
    }
    
    // Get histogram stats
    const histogramStats = histogramStatsData ? {
      bin: (histogramStatsData as unknown as Record<string, unknown>)?.bin as { min: number; step: number; round_to: number } | null || null
    } : null
    
    // Only return params if we have valid bin data
    if (!histogramStats?.bin) {
      return null
    }
    
    return {
      histogramColumn,
      histogramBreakdownColumn,
      tablePath,
      queryEngine,
      filterCondition,
      histogramStatsData: {
        bin: histogramStats.bin
      }
    }
  }, [tablePath, queryEngine, histogramColumn, histogramBreakdownColumn, filterCondition, histogramStatsData])

  const { data, loading, error, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.histogram,
    fetchAction: fetchHistogram,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => params,
    dependencies: [params]
  })

  // Combine loading states and errors
  const combinedLoading = loading || statsLoading
  const combinedError = error || statsError

  return {
    data: (data || []) as HistogramGroup[],
    loading: combinedLoading,
    error: combinedError,
    setNeedRefresh
  }
}