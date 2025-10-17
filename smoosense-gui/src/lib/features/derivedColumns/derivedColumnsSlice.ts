import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {ColumnMeta} from '@/lib/api/queries'
import {RenderType} from '@/lib/utils/agGridCellRenderers'

interface DerivedColumnParams {
  [key: string]: string // JSONata expressions
}

interface DerivedColumn {
  name: string
  renderType: RenderType
  baseUrl?: string
  params?: DerivedColumnParams
  expression?: string // For simple computed columns
}

interface DerivedColumnsState {
  columns: DerivedColumn[]
  initialized: boolean
}

const initialState: DerivedColumnsState = {
  columns: [],
  initialized: false
}


const derivedColumnsSlice = createSlice({
  name: 'derivedColumns',
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeDerivedColumns: (state, action: PayloadAction<{ columns: ColumnMeta[] }>) => {
      if (state.initialized) return
      state.columns = []
      state.initialized = true
    },
    
    addDerivedColumn: (state, action: PayloadAction<DerivedColumn>) => {
      const existingIndex = state.columns.findIndex(col => col.name === action.payload.name)
      if (existingIndex !== -1) {
        state.columns[existingIndex] = action.payload
      } else {
        state.columns.push(action.payload)
      }
    },
    
    removeDerivedColumn: (state, action: PayloadAction<string>) => {
      state.columns = state.columns.filter(col => col.name !== action.payload)
    },
    
    reset: (state) => {
      state.columns = []
      state.initialized = false
    }
  }
})

export const {
  initializeDerivedColumns,
  addDerivedColumn,
  removeDerivedColumn,
  reset
} = derivedColumnsSlice.actions

export default derivedColumnsSlice.reducer
export type { DerivedColumn, DerivedColumnParams, DerivedColumnsState }