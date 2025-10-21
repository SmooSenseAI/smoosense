import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { ColumnMeta } from '@/lib/api/queries'
import { getColumnMetadata } from '@/lib/api/queries'

export interface ColumnMetaState {
  data: ColumnMeta[] | null
  loading: boolean
  error: string | null
}

const initialState: ColumnMetaState = {
  data: null,
  loading: false,
  error: null,
}

// Async thunk for fetching column metadata
export const fetchColumnMetadata = createAsyncThunk(
  'columnMeta/fetchColumnMetadata',
  async (tablePath: string, { dispatch }) => {
    const result = await getColumnMetadata(tablePath, dispatch)
    return result
  },
  {
    condition: (tablePath, { getState }) => {
      // Only proceed if we have a valid tablePath
      if (!tablePath || tablePath.trim() === '') {
        return false
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = getState() as any
      const currentState = state.columnMeta
      
      // Only allow if we don't have data yet and not currently loading
      return !currentState.data && !currentState.loading
    }
  }
)

const columnMetaSlice = createSlice({
  name: 'columnMeta',
  initialState,
  reducers: {
    clearColumnMeta: (state) => {
      state.data = null
      state.loading = false
      state.error = null
    },
    setColumnMetaError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchColumnMetadata.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchColumnMetadata.fulfilled, (state, action) => {
        state.data = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(fetchColumnMetadata.rejected, (state, action) => {
        state.data = null
        state.loading = false
        state.error = action.error.message || 'Failed to fetch column metadata'
      })
  },
})

export const { clearColumnMeta, setColumnMetaError } = columnMetaSlice.actions
export default columnMetaSlice.reducer