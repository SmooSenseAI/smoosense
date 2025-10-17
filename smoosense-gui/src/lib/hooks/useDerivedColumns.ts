import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useColumnMeta } from './useColumnMeta'
import { initializeDerivedColumns } from '@/lib/features/derivedColumns/derivedColumnsSlice'
import type { DerivedColumn } from '@/lib/features/derivedColumns/derivedColumnsSlice'

/**
 * Hook to get derived columns based on column metadata patterns
 * Automatically initializes derived columns when column metadata is available
 * 
 * @returns Object with derived columns data and state
 */
export function useDerivedColumns() {
  const dispatch = useAppDispatch()
  const { columns, loading, error } = useColumnMeta()
  
  const derivedColumnsState = useAppSelector((state) => state.derivedColumns)
  const { columns: derivedColumns, initialized } = derivedColumnsState
  
  // Initialize derived columns when column metadata is loaded
  useEffect(() => {
    if (!initialized && columns && columns.length > 0 && !loading && !error) {
      dispatch(initializeDerivedColumns({ columns }))
    }
  }, [dispatch, columns, loading, error, initialized])
  
  return {
    derivedColumns: derivedColumns || [],
    initialized,
    loading: loading || !initialized,
    error,
    hasData: (derivedColumns || []).length > 0
  }
}

/**
 * Hook to get a specific derived column by name
 * 
 * @param columnName - Name of the derived column to get
 * @returns The derived column or null if not found
 */
export function useDerivedColumn(columnName: string): DerivedColumn | null {
  const { derivedColumns } = useDerivedColumns()
  
  return derivedColumns.find(col => col.name === columnName) || null
}