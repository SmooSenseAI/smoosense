import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { useColumnMeta } from './useColumnMeta'
import { useDerivedColumns } from './useDerivedColumns'
import { 
  initializeFromColumnMetadata
} from '../features/colDefs/agSlice'

/**
 * Hook to manage ag grid column definitions based on column metadata
 * Simply consumes metadata from useColumnMeta and creates column definitions
 */
export function useAg() {
  const dispatch = useDispatch<AppDispatch>()
  const { columnDefs, columnDefsInitialized } = useSelector((state: RootState) => state.ag)
  
  // Get column metadata for the current file
  const { 
    columns, 
    loading: columnMetaLoading, 
    error: columnMetaError 
  } = useColumnMeta()
  
  // Get derived columns
  const {
    derivedColumns,
    loading: derivedColumnsLoading,
    error: derivedColumnsError
  } = useDerivedColumns()

  // Determine if we should initialize column definitions
  const shouldInit = !columnDefsInitialized && 
                     !columnMetaLoading && 
                     !derivedColumnsLoading &&
                     !columnMetaError && 
                     !derivedColumnsError &&
                     columns.length > 0

  // Initialize column definitions when conditions are met
  useEffect(() => {
    if (shouldInit) {
      dispatch(initializeFromColumnMetadata({
        columns,
        derivedColumns
      }))
    }
  }, [shouldInit, dispatch, columns, derivedColumns])

  return {
    ag: columnDefs,
    loading: columnMetaLoading || derivedColumnsLoading,
    error: columnMetaError || derivedColumnsError,
    columns, // Also return raw column metadata for reference
    derivedColumns // Also return derived columns for reference
  }
}