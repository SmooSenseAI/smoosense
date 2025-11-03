import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from '@/lib/store'
import { queryColumnStats } from './statsUtils'
import { createCommonReducers, addCommonExtraReducers } from './sliceUtils'
import { FilterType } from '@/lib/features/filters/types'
import type {
  ColumnStats,
  ColStatsState
} from './types'

// Re-export types for backward compatibility
export type {
  CategoricalCntValue,
  HistogramCntValue,
  ColumnStats,
  CategoricalStats,
  HistogramStats,
  TextStats,
  ColumnStatsState,
  ColStatsState
} from './types'

// Re-export padItems for backward compatibility
export { padItems } from './utils'


const initialState: ColStatsState = {}

// Async thunk to query base column statistics
export const queryBaseColumnStats = createAsyncThunk<
  { columnName: string; stats: ColumnStats },
  { columnName: string; sqlQuery: string; filterType: FilterType },
  { dispatch: AppDispatch; state: RootState }
>(
  'colBaseStats/queryBaseColumnStats',
  async ({ columnName, sqlQuery, filterType }, { dispatch, getState }) => {
    const state = getState()
    const queryEngine = state.ui.queryEngine
    const tablePath = state.ui.tablePath

    if (!queryEngine) {
      throw new Error('queryEngine is required')
    }
    if (!tablePath) {
      throw new Error('tablePath is required')
    }

    return queryColumnStats({
      columnName,
      dispatch,
      keyPrefix: 'colstats',
      sqlQuery,
      filterType,
      queryEngine,
      tablePath
    })
  }
)

const colBaseStatsSlice = createSlice({
  name: 'colBaseStats',
  initialState,
  reducers: createCommonReducers(),
  extraReducers: (builder) => {
    addCommonExtraReducers(
      builder,
      queryBaseColumnStats,
      'Failed to query column statistics'
    )
  }
})

export const {
  clearStats: clearBaseStats,
  clearColumnStats: clearBaseColumnStats,
  clearColumnError: clearBaseColumnError,
  setNeedRefresh: setBaseNeedRefresh
} = colBaseStatsSlice.actions

export default colBaseStatsSlice.reducer