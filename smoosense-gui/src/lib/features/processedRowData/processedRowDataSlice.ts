import {type BaseAsyncDataState, createAsyncDataSlice} from '@/lib/utils/createAsyncDataSlice'
import {isNil} from 'lodash'

export type ProcessedRowDataState = BaseAsyncDataState<Record<string, unknown>[]>

interface FetchProcessedRowDataParams {
  rawData: Record<string, unknown>[]
}

// Processed row data fetch function
const fetchProcessedRowDataFunction = async (
  { rawData }: FetchProcessedRowDataParams
): Promise<Record<string, unknown>[]> => {
  if (!rawData || rawData.length === 0) {
    return []
  }

  // Return raw data as-is - URL resolution now happens in cell renderers
  // This preserves original URLs for proper file type detection
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