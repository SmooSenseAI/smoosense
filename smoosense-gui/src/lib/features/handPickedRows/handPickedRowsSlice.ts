import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface HandPickedRowsState {
  rows: Record<string, unknown>[]
}

const initialState: HandPickedRowsState = {
  rows: []
}

const handPickedRowsSlice = createSlice({
  name: 'handPickedRows',
  initialState,
  reducers: {
    handPickRow: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.rows.push(action.payload)
    },
    removeRow: (state, action: PayloadAction<number>) => {
      state.rows.splice(action.payload, 1)
    },
    clearHandPickedRows: (state) => {
      state.rows = []
    }
  }
})

export const { handPickRow, removeRow, clearHandPickedRows } = handPickedRowsSlice.actions
export default handPickedRowsSlice.reducer
