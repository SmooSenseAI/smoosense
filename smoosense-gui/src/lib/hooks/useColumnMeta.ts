import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import type { RootState, AppDispatch } from '@/lib/store'
import { fetchColumnMetadata } from '@/lib/features/columnMeta/columnMetaSlice'
import type { ColumnMeta } from '@/lib/api/queries'

interface UseColumnMetaResult {
  columns: ColumnMeta[]
  loading: boolean
  error: string | null
  tablePath: string
}

interface UseSingleColumnMetaResult {
  columnMeta: ColumnMeta | undefined
  loading: boolean
  error: string | null
  tablePath: string
}

export function useColumnMeta(): UseColumnMetaResult {
  const dispatch = useDispatch<AppDispatch>()
  const tablePath = useSelector((state: RootState) => state.ui.tablePath)
  const queryEngine = useSelector((state: RootState) => state.ui.queryEngine)
  const { data, loading, error } = useSelector((state: RootState) => state.columnMeta, shallowEqual)



  useEffect(() => {
    if (tablePath) {
      // Always try to dispatch - let the thunk handle the condition logic
      dispatch(fetchColumnMetadata({ tablePath, queryEngine }))
    }
  }, [dispatch, tablePath, queryEngine])

  return useMemo(() => ({
    columns: (data || []) as ColumnMeta[],
    loading,
    error,
    tablePath: tablePath || ''
  }), [data, loading, error, tablePath])
}

export function useSingleColumnMeta(columnName: string): UseSingleColumnMetaResult {
  const { columns, loading, error, tablePath } = useColumnMeta()
  
  const columnMeta = columns.find(col => col.column_name === columnName)
  
  return {
    columnMeta,
    loading,
    error,
    tablePath
  }
}