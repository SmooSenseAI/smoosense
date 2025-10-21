import { useAppSelector } from '@/lib/hooks'
import { fetchBalanceMap, setNeedRefresh as setNeedRefreshAction, type BalanceMapGroup } from './balanceMapSlice'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useColFilteredStats } from '@/lib/hooks'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { useMemo } from 'react'

interface UseBalanceMapResult {
  data: BalanceMapGroup[]
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

export function useBalanceMap(): UseBalanceMapResult {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const bubblePlotXColumn = useAppSelector((state) => state.ui.bubblePlotXColumn)
  const bubblePlotYColumn = useAppSelector((state) => state.ui.bubblePlotYColumn)
  const bubblePlotBreakdownColumn = useAppSelector((state) => state.ui.bubblePlotBreakdownColumn)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))

  // Get stats for X and Y columns to determine bins
  const { data: xStatsData, loading: xStatsLoading, error: xStatsError } = useColFilteredStats(bubblePlotXColumn)
  const { data: yStatsData, loading: yStatsLoading, error: yStatsError } = useColFilteredStats(bubblePlotYColumn)

  // Build parameters for balance map fetching
  const params = useMemo(() => {
    if (!tablePath || !bubblePlotXColumn || !bubblePlotYColumn || !bubblePlotBreakdownColumn || !xStatsData || !yStatsData) {
      return null
    }

    // Get bin data for X and Y columns
    const xBin = (xStatsData as unknown as Record<string, unknown>)?.bin as { min: number; step: number; round_to: number } | null
    const yBin = (yStatsData as unknown as Record<string, unknown>)?.bin as { min: number; step: number; round_to: number } | null

    // Only return params if we have valid bin data for both columns
    if (!xBin || !yBin) {
      return null
    }

    return {
      bubblePlotXColumn,
      bubblePlotYColumn,
      bubblePlotBreakdownColumn,
      tablePath,
      filterCondition,
      xBin,
      yBin
    }
  }, [tablePath, bubblePlotXColumn, bubblePlotYColumn, bubblePlotBreakdownColumn, filterCondition, xStatsData, yStatsData])

  const { data, loading, error, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.balanceMap,
    fetchAction: fetchBalanceMap,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => params,
    dependencies: [params]
  })

  // Combine loading states and errors
  const combinedLoading = loading || xStatsLoading || yStatsLoading
  const combinedError = error || xStatsError || yStatsError

  return {
    data: (data || []) as BalanceMapGroup[],
    loading: combinedLoading,
    error: combinedError,
    setNeedRefresh
  }
}