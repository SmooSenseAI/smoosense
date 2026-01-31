import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Primary key values can be string, number, or other primitive types
export type PrimaryKeyValue = string | number | boolean | null

export interface HandPickedRowsState {
  // Array of primary key values for picked rows
  pickedKeys: PrimaryKeyValue[]
}

const initialState: HandPickedRowsState = {
  pickedKeys: []
}

const handPickedRowsSlice = createSlice({
  name: 'handPickedRows',
  initialState,
  reducers: {
    // Toggle a row's picked state
    handPickRow: (state, action: PayloadAction<PrimaryKeyValue>) => {
      const index = state.pickedKeys.indexOf(action.payload)
      if (index !== -1) {
        state.pickedKeys.splice(index, 1)
      } else {
        state.pickedKeys.push(action.payload)
      }
    },
    removeRow: (state, action: PayloadAction<PrimaryKeyValue>) => {
      const index = state.pickedKeys.indexOf(action.payload)
      if (index !== -1) {
        state.pickedKeys.splice(index, 1)
      }
    },
    removeRowByIndex: (state, action: PayloadAction<number>) => {
      state.pickedKeys.splice(action.payload, 1)
    },
    clearHandPickedRows: (state) => {
      state.pickedKeys = []
    },
    // Batch add multiple rows (only adds new ones)
    handPickRows: (state, action: PayloadAction<PrimaryKeyValue[]>) => {
      for (const pkValue of action.payload) {
        if (!state.pickedKeys.includes(pkValue)) {
          state.pickedKeys.push(pkValue)
        }
      }
    }
  }
})

export const { handPickRow, removeRow, removeRowByIndex, clearHandPickedRows, handPickRows } = handPickedRowsSlice.actions
export default handPickedRowsSlice.reducer
