import { useAppSelector } from '@/lib/hooks'
import { fetchHeatmap, setNeedRefresh as setNeedRefreshAction, type HeatmapResult } from '@/lib/features/heatmap/heatmapSlice'
import { useAsyncData } from './useAsyncData'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { useMemo } from 'react'

interface UseHeatMapResult {
  data: HeatmapResult | null
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

/**
 * Hook to get heatmap data
 * Depends on heatmap X and Y column selection
 */
export function useHeatMap(): UseHeatMapResult {
  const filePath = useAppSelector((state) => state.ui.filePath)
  const heatmapXColumn = useAppSelector((state) => state.ui.heatmapXColumn)
  const heatmapYColumn = useAppSelector((state) => state.ui.heatmapYColumn)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  
  // Build parameters for heatmap fetching
  const params = useMemo(() => {
    if (!filePath || !heatmapXColumn || !heatmapYColumn) {
      return null
    }
    
    return {
      heatmapXColumn,
      heatmapYColumn,
      filePath,
      filterCondition
    }
  }, [filePath, heatmapXColumn, heatmapYColumn, filterCondition])

  const { data, loading, error, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.heatmap,
    fetchAction: fetchHeatmap,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => params,
    dependencies: [params]
  })

  return {
    data: data as HeatmapResult | null,
    loading,
    error,
    setNeedRefresh
  }
}