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
  { columnName: string; sqlQuery: string; filterType: FilterType; queryEngine?: 'duckdb' | 'athena' | 'lance' },
  { dispatch: AppDispatch; state: RootState }
>(
  'colBaseStats/queryBaseColumnStats',
  async ({ columnName, sqlQuery, filterType, queryEngine = 'duckdb' }, { dispatch }) => {
    return queryColumnStats({
      columnName,
      dispatch,
      keyPrefix: 'colstats',
      sqlQuery,
      filterType,
      queryEngine
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