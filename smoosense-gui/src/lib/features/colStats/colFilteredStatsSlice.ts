import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from '@/lib/store'
import { queryColumnStats } from './statsUtils'
import { createCommonReducers, addCommonExtraReducers } from './sliceUtils'
import { FilterType } from '@/lib/features/filters/types'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import type {
  ColumnStats,
  ColFilteredStatsState
} from './types'

// Re-export types for convenience
export type {
  CategoricalCntValue,
  HistogramCntValue,
  ColumnStats,
  CategoricalStats,
  HistogramStats,
  TextStats,
  ColumnStatsState
} from './types'

const initialState: ColFilteredStatsState = {}

// Async thunk to query filtered column statistics
export const queryFilteredColumnStats = createAsyncThunk<
  { columnName: string; stats: ColumnStats },
  { columnName: string; sqlQuery: string; filterType: FilterType; queryEngine?: 'duckdb' | 'athena' | 'lance' },
  { dispatch: AppDispatch; state: RootState }
>(
  'colFilteredStats/queryFilteredColumnStats',
  async ({ columnName, sqlQuery, filterType, queryEngine = 'duckdb' }, { dispatch }) => {
    return queryColumnStats({
      columnName,
      dispatch,
      keyPrefix: 'colFilteredStats',
      sqlQuery,
      filterType,
      queryEngine
    })
  }
)

const colFilteredStatsSlice = createSlice({
  name: 'colFilteredStats',
  initialState,
  reducers: {
    ...createCommonReducers(),
    // Set filtered stats data directly (for copying from base stats)
    setFilteredColumnStats: (state, action: PayloadAction<{ columnName: string; stats: ColumnStats }>) => {
      const { columnName, stats } = action.payload
      state[columnName] = {
        data: stats,
        loading: false,
        error: null,
        needRefresh: false
      }
    }
  },
  extraReducers: (builder) => {
    addCommonExtraReducers(
      builder,
      queryFilteredColumnStats,
      'Failed to query filtered column statistics'
    )
    
    // Clear all filtered stats when any filter is applied/changed/removed
    builder.addCase(setColumnFilter, (state) => {
      // Clear all filtered stats to force refresh
      Object.keys(state).forEach(columnName => {
        delete state[columnName]
      })
    })
  }
})

export const {
  clearStats: clearFilteredStats,
  clearColumnStats: clearFilteredColumnStats,
  clearColumnError: clearFilteredColumnError,
  setNeedRefresh: setFilteredNeedRefresh,
  setFilteredColumnStats
} = colFilteredStatsSlice.actions

export default colFilteredStatsSlice.reducer