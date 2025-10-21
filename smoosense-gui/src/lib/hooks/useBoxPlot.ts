import { useAppSelector } from '@/lib/hooks'
import { fetchBoxPlot, setNeedRefresh as setNeedRefreshAction, type BoxPlotDataPoint } from '@/lib/features/boxplot/boxPlotSlice'
import { useAsyncData } from './useAsyncData'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { useMemo } from 'react'

interface UseBoxPlotResult {
  data: BoxPlotDataPoint[]
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

/**
 * Hook to get box plot data
 * Depends on box plot column selection and breakdown column
 */
export function useBoxPlot(): UseBoxPlotResult {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const boxPlotColumns = useAppSelector((state) => state.ui.boxPlotColumns)
  const boxPlotBreakdownColumn = useAppSelector((state) => state.ui.boxPlotBreakdownColumn)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  
  // Build parameters for box plot fetching
  const params = useMemo(() => {
    if (!tablePath || boxPlotColumns.length === 0) {
      return null
    }
    
    return {
      boxPlotColumns,
      boxPlotBreakdownColumn,
      tablePath,
      filterCondition
    }
  }, [tablePath, boxPlotColumns, boxPlotBreakdownColumn, filterCondition])

  const { data, loading, error, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.boxPlot,
    fetchAction: fetchBoxPlot,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => params,
    dependencies: [params]
  })

  return {
    data: (data || []) as BoxPlotDataPoint[],
    loading,
    error,
    setNeedRefresh
  }
}