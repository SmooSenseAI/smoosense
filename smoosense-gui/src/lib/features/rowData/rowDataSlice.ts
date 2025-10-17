import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import type { AppDispatch, RootState } from '@/lib/store'

export type RowDataState = BaseAsyncDataState<Record<string, unknown>[]>

interface FetchRowDataParams {
  query: string
}

// Row data fetch function
const fetchRowDataFunction = async (
  { query }: FetchRowDataParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<Record<string, unknown>[]> => {
  // Fetch the raw row data only
  const rowData = await executeQueryAsListOfDict(query, 'rowData', dispatch)
  return rowData
}

// Should wait condition - check if query is provided
const rowDataShouldWait = ({ query }: FetchRowDataParams) => {
  // Only proceed if we have a valid query
  return !!query && query.trim() !== ''
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<Record<string, unknown>[], FetchRowDataParams>({
  name: 'rowData',
  fetchFunction: fetchRowDataFunction,
  shouldWait: rowDataShouldWait,
  errorMessage: 'Failed to fetch row data'
})

// Custom action to handle Random button click
const clickForRandomSamples = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const { samplingCondition } = state.viewing
  
  // If samplingCondition is not set, set it to "TRUE"
  if (samplingCondition === null) {
    dispatch(setSamplingCondition('TRUE'))
  }
  
  // Set needRefresh to trigger data refetch
  dispatch(setNeedRefresh(true))
}

export const rowDataSlice = sliceResult.slice
export const fetchRowData = sliceResult.fetchThunk
export const { clearRowData, setRowDataError, setNeedRefresh } = sliceResult.actions
export { clickForRandomSamples }
export default sliceResult.reducer