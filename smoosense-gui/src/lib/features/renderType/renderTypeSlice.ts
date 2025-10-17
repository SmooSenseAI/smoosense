import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RenderType } from '@/lib/utils/agGridCellRenderers'

// State shape - dictionary keyed by column name
export type RenderTypeState = Record<string, RenderType>

const initialState: RenderTypeState = {}

const renderTypeSlice = createSlice({
  name: 'renderType',
  initialState,
  reducers: {
    // Set render type for a single column
    setRenderType: (state, action: PayloadAction<{ columnName: string; renderType: RenderType }>) => {
      const { columnName, renderType } = action.payload
      state[columnName] = renderType
    },

    // Set render types for multiple columns at once
    setRenderTypes: (state, action: PayloadAction<Record<string, RenderType>>) => {
      Object.assign(state, action.payload)
    },

    // Initialize render types for columns that don't have them yet
    initializeRenderTypes: (state, action: PayloadAction<{ columnName: string; renderType: RenderType }[]>) => {
      action.payload.forEach(({ columnName, renderType }) => {
        // Only set if not already defined
        if (!(columnName in state)) {
          state[columnName] = renderType
        }
      })
    },

    // Remove render type for a specific column
    clearRenderType: (state, action: PayloadAction<string>) => {
      const columnName = action.payload
      delete state[columnName]
    },

    // Clear all render types
    clearAllRenderTypes: () => {
      return {}
    }
  }
})

export const {
  setRenderType,
  setRenderTypes,
  initializeRenderTypes,
  clearRenderType,
  clearAllRenderTypes
} = renderTypeSlice.actions

export default renderTypeSlice.reducer