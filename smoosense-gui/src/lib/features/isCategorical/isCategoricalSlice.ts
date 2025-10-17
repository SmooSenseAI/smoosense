import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// State shape - dictionary keyed by column name
export type IsCategoricalState = Record<string, boolean | null>

const initialState: IsCategoricalState = {}

const isCategoricalSlice = createSlice({
  name: 'isCategorical',
  initialState,
  reducers: {
    // Set isCategorical for a single column
    setIsCategorical: (state, action: PayloadAction<{ columnName: string; isCategorical: boolean | null }>) => {
      const { columnName, isCategorical } = action.payload
      state[columnName] = isCategorical
    },


  }
})

export const {
  setIsCategorical
} = isCategoricalSlice.actions

export default isCategoricalSlice.reducer