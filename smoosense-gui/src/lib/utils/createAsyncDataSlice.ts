import { createSlice, createAsyncThunk, PayloadAction, Draft } from '@reduxjs/toolkit'

export interface BaseAsyncDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  needRefresh: boolean
}

interface CreateAsyncDataSliceOptions<T, P> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFunction: (params: P, dispatch: any, getState?: any) => Promise<T>
  shouldWait?: (params: P, state?: { getState: () => unknown }) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFulfilled?: (data: T, dispatch: any) => void
  errorMessage?: string
}

export function createAsyncDataSlice<T, P = string>({
  name,
  fetchFunction,
  shouldWait,
  onFulfilled,
  errorMessage = `Failed to fetch ${name}`
}: CreateAsyncDataSliceOptions<T, P>) {
  
  const initialState: BaseAsyncDataState<T> = {
    data: null,
    loading: false,
    error: null,
    needRefresh: false,
  }

  // Create async thunk
  const fetchThunk = createAsyncThunk(
    `${name}/fetch${name.charAt(0).toUpperCase() + name.slice(1)}`,
    async (params: P, { dispatch, getState }) => {
      const result = await fetchFunction(params, dispatch, getState)
      
      // Call onFulfilled callback if provided
      if (onFulfilled && result) {
        onFulfilled(result, dispatch)
      }
      
      return result
    },
    {
      condition: (params: P, { getState }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = getState() as any
        const currentState = state[name] as BaseAsyncDataState<T>
        
        // First check shouldWait - necessary condition that must be true
        if (shouldWait && !shouldWait(params)) {
          return false
        }
        
        // Then check if we need to fetch - sufficient conditions
        const needsData = !currentState.data || currentState.needRefresh
        
        return needsData
      }
    }
  )

  // Create slice
  const slice = createSlice({
    name,
    initialState,
    reducers: {
      [`clear${name.charAt(0).toUpperCase() + name.slice(1)}`]: (state) => {
        state.data = null
        state.loading = false
        state.error = null
        state.needRefresh = false
      },
      [`set${name.charAt(0).toUpperCase() + name.slice(1)}Error`]: (state, action: PayloadAction<string>) => {
        state.error = action.payload
        state.loading = false
      },
      setNeedRefresh: (state, action: PayloadAction<boolean>) => {
        state.needRefresh = action.payload
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchThunk.pending, (state) => {
          state.loading = true
          state.error = null
        })
        .addCase(fetchThunk.fulfilled, (state, action) => {
          state.data = action.payload as Draft<T> | null
          state.loading = false
          state.error = null
          state.needRefresh = false
        })
        .addCase(fetchThunk.rejected, (state, action) => {
          state.data = null
          state.loading = false
          state.error = action.error.message || errorMessage
          state.needRefresh = false
        })
    },
  })

  return {
    slice,
    fetchThunk,
    actions: slice.actions,
    reducer: slice.reducer,
  }
}