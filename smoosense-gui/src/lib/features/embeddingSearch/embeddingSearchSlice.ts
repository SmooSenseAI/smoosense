import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Embedding search result types
export type EmbeddingSearchResult = Record<string, unknown>

export interface EmbeddingSearchData {
  columns: string[]
  data: EmbeddingSearchResult[]
  count: number
}

export type EmbeddingSearchState = BaseAsyncDataState<EmbeddingSearchData>

interface FetchEmbeddingSearchParams {
  queryText: string
  tablePath: string
  limit?: number
}

// Embedding search fetch function
const fetchEmbeddingSearchFunction = async (
  params: FetchEmbeddingSearchParams
): Promise<EmbeddingSearchData> => {
  const { queryText, tablePath, limit = 10 } = params

  // Build query params
  const queryParams = new URLSearchParams({
    tablePath,
    queryText,
    limit: limit.toString()
  })

  // Make API request
  const response = await fetch(`/api/lance/search?${queryParams}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Search failed')
  }

  const data = await response.json()
  return data
}

// Should wait condition
const embeddingSearchShouldWait = (params: FetchEmbeddingSearchParams) => {
  return !!(params.queryText && params.tablePath)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<EmbeddingSearchData, FetchEmbeddingSearchParams>({
  name: 'embeddingSearch',
  fetchFunction: fetchEmbeddingSearchFunction,
  shouldWait: embeddingSearchShouldWait,
  errorMessage: 'Failed to perform embedding search'
})

// Extend the slice with properly typed reducers
const extendedSlice = createSlice({
  name: 'embeddingSearch',
  initialState: sliceResult.slice.getInitialState(),
  reducers: {
    clearEmbeddingSearch: (state) => {
      state.data = null
      state.loading = false
      state.error = null
      state.needRefresh = false
    },
    setEmbeddingSearchError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    setNeedRefresh: (state, action: PayloadAction<boolean>) => {
      state.needRefresh = action.payload
    }
  },
  extraReducers: (builder) => {
    // Copy over the async thunk handlers from the original slice
    builder
      .addCase(sliceResult.fetchThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sliceResult.fetchThunk.fulfilled, (state, action) => {
        state.data = action.payload
        state.loading = false
        state.error = null
        state.needRefresh = false
      })
      .addCase(sliceResult.fetchThunk.rejected, (state, action) => {
        state.data = null
        state.loading = false
        state.error = action.error.message || 'Failed to perform embedding search'
        state.needRefresh = false
      })
  }
})

export const embeddingSearchSlice = extendedSlice
export const fetchEmbeddingSearch = sliceResult.fetchThunk
export const { clearEmbeddingSearch, setEmbeddingSearchError, setNeedRefresh } = extendedSlice.actions
export default extendedSlice.reducer
