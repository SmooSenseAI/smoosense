import { useEffect, useRef, DependencyList } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'

interface UseAsyncDataOptions<T, P> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateSelector: (state: any) => BaseAsyncDataState<T>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchAction: (params: P) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNeedRefreshAction: (needRefresh: boolean) => any
  buildParams: () => P | null
  dependencies: DependencyList
}

interface UseAsyncDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

export function useAsyncData<T, P>({
  stateSelector,
  fetchAction,
  setNeedRefreshAction,
  buildParams,
  dependencies
}: UseAsyncDataOptions<T, P>): UseAsyncDataResult<T> {
  const dispatch = useAppDispatch()
  const state = useAppSelector(stateSelector)
  const needRefresh = state.needRefresh
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevDepsRef = useRef<any[]>([])

  const handleSetNeedRefresh = (needRefresh: boolean) => {
    dispatch(setNeedRefreshAction(needRefresh))
  }

  useEffect(() => {
    const params = buildParams()
    if (params) {
      // Check if this is not the first render and dependencies changed
      const isFirstRender = prevDepsRef.current.length === 0
      const currentDeps = Array.isArray(dependencies) ? dependencies : [dependencies]
      const depsChanged = !isFirstRender && 
        JSON.stringify(prevDepsRef.current) !== JSON.stringify(currentDeps)
      
      // Dispatch if first render, dependencies changed, or needRefresh is true
      if (isFirstRender || depsChanged || needRefresh) {
        // If dependencies changed, trigger refresh
        if (depsChanged) {
          dispatch(setNeedRefreshAction(true))
        }
        
        // Dispatch fetch action
        dispatch(fetchAction(params))
      }
      
      // Update previous dependencies
      prevDepsRef.current = currentDeps
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(Array.isArray(dependencies) ? dependencies : [dependencies]), needRefresh])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    setNeedRefresh: handleSetNeedRefresh
  }
}