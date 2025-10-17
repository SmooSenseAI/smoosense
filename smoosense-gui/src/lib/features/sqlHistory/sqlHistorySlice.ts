import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { QueryResult } from '@/lib/api/queries'

interface SqlExecution {
  query: string
  result: QueryResult
  timestamp: string
}

interface SqlHistoryState {
  executions: Record<string, SqlExecution>
}

const initialState: SqlHistoryState = {
  executions: {}
}

export const sqlHistorySlice = createSlice({
  name: 'sqlHistory',
  initialState,
  reducers: {
    addExecution: (state, action: PayloadAction<{ sqlKey: string; query: string; result: QueryResult }>) => {
      state.executions[action.payload.sqlKey] = {
        query: action.payload.query,
        result: action.payload.result,
        timestamp: new Date().toISOString()
      }
    },
    clearHistory: (state) => {
      state.executions = {}
    },
    removeExecution: (state, action: PayloadAction<string>) => {
      delete state.executions[action.payload]
    }
  },
})

export const { 
  addExecution, 
  clearHistory, 
  removeExecution
} = sqlHistorySlice.actions

export default sqlHistorySlice.reducer