import { useRowData } from './useRowData'
import { useAsyncData } from './useAsyncData'
import { fetchProcessedRowData, setNeedRefresh as setNeedRefreshAction } from '@/lib/features/processedRowData/processedRowDataSlice'

interface UseProcessedRowDataResult {
  data: Record<string, unknown>[]
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

export function useProcessedRowData(): UseProcessedRowDataResult {
  // Get raw row data first
  const { data: rawData, loading: rawDataLoading, error: rawDataError } = useRowData()

  // Use the async data pattern for processed row data
  const { data: processedData, loading: processedLoading, error: processedError, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.processedRowData,
    fetchAction: fetchProcessedRowData,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => {
      return { rawData }
    },
    dependencies: [rawData]
  })

  return {
    data: (processedData || []) as Record<string, unknown>[],
    loading: rawDataLoading || processedLoading,
    error: rawDataError || processedError,
    setNeedRefresh
  }
}