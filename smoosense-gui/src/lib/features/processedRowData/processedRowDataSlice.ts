import {type BaseAsyncDataState, createAsyncDataSlice} from '@/lib/utils/createAsyncDataSlice'
import {needToResolveMediaUrl, resolveAssetUrl} from '@/lib/utils/mediaUrlUtils'
import {isNil, mapValues} from 'lodash'

export type ProcessedRowDataState = BaseAsyncDataState<Record<string, unknown>[]>

interface FetchProcessedRowDataParams {
  rawData: Record<string, unknown>[]
}

// Processed row data fetch function
const fetchProcessedRowDataFunction = async (
  { rawData }: FetchProcessedRowDataParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState?: any
): Promise<Record<string, unknown>[]> => {
  if (!rawData || rawData.length === 0) {
    return []
  }

  // Process all cells: resolve media URLs
  if (getState) {
    const state = getState()
    const tablePath = state.ui?.tablePath
    const baseUrl = state.ui?.baseUrl

    // Only process if both tablePath and baseUrl are available
    if (tablePath && baseUrl) {
      // Use pure functional map to transform data without mutation
      return rawData.map((row) =>
        mapValues(row, (value) =>
          needToResolveMediaUrl(value)
            ? resolveAssetUrl(value as string, tablePath, baseUrl)
            : value
        )
      )
    }
  }

  return rawData
}

// Should wait condition - check if rawData is provided
const processedRowDataShouldWait = ({ rawData }: FetchProcessedRowDataParams) => {
  return !isNil(rawData)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<Record<string, unknown>[], FetchProcessedRowDataParams>({
  name: 'processedRowData',
  fetchFunction: fetchProcessedRowDataFunction,
  shouldWait: processedRowDataShouldWait,
  errorMessage: 'Failed to process row data'
})

export const processedRowDataSlice = sliceResult.slice
export const fetchProcessedRowData = sliceResult.fetchThunk
export const { clearProcessedRowData, setProcessedRowDataError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer