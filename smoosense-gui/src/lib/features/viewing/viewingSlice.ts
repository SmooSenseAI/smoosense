import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ViewingState {
  pageSize: number
  pageNumber: number
  totalRows: number | null
  justClickedRowId: string | null
  samplingCondition: string | null
}

const initialState: ViewingState = {
  pageSize: 10,
  pageNumber: 1,
  totalRows: null,
  justClickedRowId: null,
  samplingCondition: null,
}

export const viewingSlice = createSlice({
  name: 'viewing',
  initialState,
  reducers: {
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
      // Reset to first page when page size changes
      state.pageNumber = 1
    },
    setPageNumber: (state, action: PayloadAction<number>) => {
      state.pageNumber = action.payload
    },
    nextPage: (state) => {
      if (state.totalRows && state.pageNumber * state.pageSize < state.totalRows) {
        state.pageNumber += 1
      }
    },
    previousPage: (state) => {
      if (state.pageNumber > 1) {
        state.pageNumber -= 1
      }
    },
    firstPage: (state) => {
      state.pageNumber = 1
    },
    lastPage: (state) => {
      if (state.totalRows) {
        state.pageNumber = Math.ceil(state.totalRows / state.pageSize)
      }
    },
    setTotalRows: (state, action: PayloadAction<number | null>) => {
      state.totalRows = action.payload
    },
    setJustClickedRowId: (state, action: PayloadAction<string | null>) => {
      state.justClickedRowId = action.payload
    },
    setSamplingCondition: (state, action: PayloadAction<string | null>) => {
      state.samplingCondition = action.payload
    },
    resetViewing: (state) => {
      state.pageSize = 10
      state.pageNumber = 1
      state.totalRows = null
      state.justClickedRowId = null
      state.samplingCondition = null
    },
  },
})

export const {
  setPageSize,
  setPageNumber,
  nextPage,
  previousPage,
  firstPage,
  lastPage,
  setTotalRows,
  setJustClickedRowId,
  setSamplingCondition,
  resetViewing,
} = viewingSlice.actions

export default viewingSlice.reducer