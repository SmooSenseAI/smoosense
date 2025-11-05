import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import type { AppDispatch, RootState } from '@/lib/store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type RowDataState = BaseAsyncDataState<Record<string, unknown>[]>

interface FetchRowDataParams {
  query: string
  tablePath: string
  queryEngine: string
}

// Row data fetch function
const fetchRowDataFunction = async (
  { query, tablePath, queryEngine }: FetchRowDataParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<Record<string, unknown>[]> => {
  // Fetch the raw row data only
  const rowData = await executeQueryAsListOfDict(query, 'rowData', dispatch, queryEngine, tablePath)
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

// Extend the slice with additional reducer for setting data directly
const extendedSlice = createSlice({
  name: 'rowData',
  initialState: sliceResult.slice.getInitialState(),
  reducers: {
    clearRowData: (state) => {
      state.data = null
      state.loading = false
      state.error = null
      state.needRefresh = false
    },
    setRowDataError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    setNeedRefresh: (state, action: PayloadAction<boolean>) => {
      state.needRefresh = action.payload
    },
    setRowData: (state, action: PayloadAction<Record<string, unknown>[]>) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Copy over the async thunk handlers from the original slice
    builder
      .addCase(sliceResult.fetchThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sliceResult.fetchThunk.fulfilled, (state, action) => {
        state.data = action.payload
        state.loading = false
        state.error = null
        state.needRefresh = false
      })
      .addCase(sliceResult.fetchThunk.rejected, (state, action) => {
        state.data = null
        state.loading = false
        state.error = action.error.message || 'Failed to fetch row data'
        state.needRefresh = false
      })
  }
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
  dispatch(extendedSlice.actions.setNeedRefresh(true))
}

export const rowDataSlice = extendedSlice
export const fetchRowData = sliceResult.fetchThunk
export const { clearRowData, setRowDataError, setNeedRefresh, setRowData } = extendedSlice.actions
export { clickForRandomSamples }
export default extendedSlice.reducer