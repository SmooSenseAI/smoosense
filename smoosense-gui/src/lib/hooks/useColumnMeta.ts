import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import type { RootState, AppDispatch } from '@/lib/store'
import { fetchColumnMetadata } from '@/lib/features/columnMeta/columnMetaSlice'
import type { ColumnMeta } from '@/lib/api/queries'

interface UseColumnMetaResult {
  columns: ColumnMeta[]
  loading: boolean
  error: string | null
  filePath: string
}

interface UseSingleColumnMetaResult {
  columnMeta: ColumnMeta | undefined
  loading: boolean
  error: string | null
  filePath: string
}

export function useColumnMeta(): UseColumnMetaResult {
  const dispatch = useDispatch<AppDispatch>()
  const filePath = useSelector((state: RootState) => state.ui.filePath)
  const { data, loading, error } = useSelector((state: RootState) => state.columnMeta, shallowEqual)



  useEffect(() => {
    if (filePath) {
      // Always try to dispatch - let the thunk handle the condition logic
      dispatch(fetchColumnMetadata(filePath))
    }
  }, [dispatch, filePath])

  return useMemo(() => ({
    columns: (data || []) as ColumnMeta[],
    loading,
    error,
    filePath: filePath || ''
  }), [data, loading, error, filePath])
}

export function useSingleColumnMeta(columnName: string): UseSingleColumnMetaResult {
  const { columns, loading, error, filePath } = useColumnMeta()
  
  const columnMeta = columns.find(col => col.column_name === columnName)
  
  return {
    columnMeta,
    loading,
    error,
    filePath
  }
}