import { PayloadAction, ActionReducerMapBuilder, Draft } from '@reduxjs/toolkit'
import type { ColumnStats, ColumnStatsState } from './types'

// Default column state structure
export const createDefaultColumnState = (): ColumnStatsState => ({
  data: null,
  loading: false,
  error: null,
  needRefresh: false
})

/**
 * Common reducers shared between base and filtered stats slices
 */
export const createCommonReducers = () => ({
  // Clear all statistics
  clearStats: () => {
    return {}
  },

  // Clear statistics for a specific column
  clearColumnStats: (state: Draft<Record<string, ColumnStatsState>>, action: PayloadAction<string>) => {
    const columnName = action.payload
    delete state[columnName]
  },

  // Clear error for a specific column
  clearColumnError: (state: Draft<Record<string, ColumnStatsState>>, action: PayloadAction<string>) => {
    const columnName = action.payload
    if (state[columnName]) {
      state[columnName].error = null
    }
  },

  // Set need refresh for a specific column
  setNeedRefresh: (state: Draft<Record<string, ColumnStatsState>>, action: PayloadAction<{ columnName: string; needRefresh: boolean }>) => {
    const { columnName, needRefresh } = action.payload
    if (!state[columnName]) {
      state[columnName] = createDefaultColumnState()
    }
    state[columnName].needRefresh = needRefresh
  }
})

/**
 * Common extra reducers for async thunk handling
 */
export const addCommonExtraReducers = (
  builder: ActionReducerMapBuilder<Record<string, ColumnStatsState>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asyncThunk: any,
  errorMessage: string
) => {
  builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .addCase(asyncThunk.pending, (state: Draft<Record<string, ColumnStatsState>>, action: any) => {
      const columnName = action.meta.arg.columnName
      if (!state[columnName]) {
        state[columnName] = createDefaultColumnState()
      }
      state[columnName].loading = true
      state[columnName].error = null
    })
    .addCase(asyncThunk.fulfilled, (state: Draft<Record<string, ColumnStatsState>>, action: PayloadAction<{ columnName: string; stats: ColumnStats }>) => {
      const { columnName, stats } = action.payload
      state[columnName] = {
        data: stats,
        loading: false,
        error: null,
        needRefresh: false
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .addCase(asyncThunk.rejected, (state: Draft<Record<string, ColumnStatsState>>, action: any) => {
      const columnName = action.meta.arg.columnName
      if (!state[columnName]) {
        state[columnName] = createDefaultColumnState()
      }

      // Check if error is a timeout
      const isTimeout = action.error.message?.includes('timeout')

      state[columnName].loading = false
      state[columnName].error = isTimeout ? 'timeout' : (action.error.message || errorMessage)
      state[columnName].data = null
      state[columnName].needRefresh = false
    })
}