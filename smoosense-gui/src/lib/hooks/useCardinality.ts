import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useSingleColumnMeta } from '@/lib/hooks/useColumnMeta'
import { isNil } from 'lodash'
import { 
  queryCardinality, 
  setCardinality,
  inferCardinalityFromMetadata
} from '@/lib/features/cardinality/cardinalitySlice'

// Column-specific hook with metadata dependency and smart initialization
export function useCardinality(columnName: string) {
  const dispatch = useAppDispatch()
  const columnState = useAppSelector((state) => state.columns.cardinality[columnName])
  
  // Get metadata state using hook that auto-fetches
  const { columnMeta, loading: metaLoading, error: metaError, tablePath } = useSingleColumnMeta(columnName)

  // Get current cardinality state with defaults
  const data = columnState?.data || null
  const loading = columnState?.loading || false
  const error = columnState?.error || null
  const hasData = !isNil(data)

  // Smart initialization and fetching logic
  useEffect(() => {
    // Wait for metadata to be ready
    if (metaLoading || metaError || !columnMeta) {
      return
    }

    // If we already have cardinality data, no need to do anything
    if (hasData || loading) {
      return
    }

    // Try to infer cardinality from metadata first
    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      // We can determine cardinality from metadata - set it directly
      dispatch(setCardinality({ columnName, cardinality: inferredCardinality }))
      return
    }

    // Cannot infer from metadata, need to query if tablePath is available
    if (tablePath) {
      dispatch(queryCardinality({ columnName, tablePath }))
    }
  }, [dispatch, columnName, columnMeta, metaLoading, metaError, hasData, loading, tablePath])


  // Determine overall loading state
  const overallLoading = metaLoading || loading
  const overallError = metaError || error

  return {
    // State
    data,
    loading: overallLoading,
    error: overallError,
    // Passover
    columnMeta,
    tablePath
  }
}

// Legacy: For components that need bulk cardinality access
// Use individual useCardinality(columnName) calls instead where possible
export function useCardinalityBulk() {
  const cardinalityColumns = useAppSelector((state) => state.columns.cardinality)
  return { cardinalityColumns }
}