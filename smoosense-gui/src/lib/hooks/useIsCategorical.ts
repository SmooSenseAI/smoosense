import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useCardinality } from './useCardinality'
import { useSingleColumnMeta } from './useColumnMeta'
import { setIsCategorical } from '@/lib/features/isCategorical/isCategoricalSlice'
import { isNil } from 'lodash'

/**
 * Hook to get or infer whether a column is categorical
 * Uses cardinality data to determine categoricalness
 *
 * @param columnName - The name of the column to check
 * @returns Object with isCategorical, loading, and error states
 */
export function useIsCategorical(columnName: string): {
  isCategorical: boolean | null
  loading: boolean
  error: string | null
} {
  const dispatch = useAppDispatch()

  // Get current isCategorical value from Redux
  const currentIsCategorical = useAppSelector((state) => state.columns.isCategorical[columnName] ?? null)

  // Get column metadata for this specific column
  const { columnMeta } = useSingleColumnMeta(columnName)

  // Get cardinality data for this column
  const cardinalityData = useCardinality(columnName)

  // Initialize this column's isCategorical from cardinality data
  useEffect(() => {
    // If we already have a definitive answer, keep it
    if (!isNil(currentIsCategorical)) {
      return
    }

    // If column is numeric, initialize as false immediately
    if (columnMeta?.typeShortcuts?.isNumeric) {
      dispatch(setIsCategorical({
        columnName,
        isCategorical: false
      }))
      return
    }

    // Wait for cardinality data to be available
    if (!cardinalityData.data) {
      return
    }

    try {
      const { cardinality, cntD, distinctRatio } = cardinalityData.data
      let isCategorical: boolean | null = null

      // Rule from architecture design:
      // A column will be considered as categorical if both conditions are met:
      // - cardinality is low
      // - cntD < 5 OR distinct ratio < 10%
      if (cardinality === 'low' && !isNil(cntD) && !isNil(distinctRatio)) {
        isCategorical = cntD < 5 || (distinctRatio < 0.1 && cntD < 100);
      } else if (cardinality === 'high') {
        isCategorical = false
      }
      // If cardinality is 'medium' or missing required data, leave as null for now

      // Update if we determined a value
      if (!isNil(isCategorical)) {
        dispatch(setIsCategorical({
          columnName,
          isCategorical
        }))
      }

    } catch (err) {
      console.error(`Failed to infer isCategorical for column ${columnName}:`, err)
    }
  }, [
    dispatch,
    columnName,
    cardinalityData.data,
    currentIsCategorical,
    columnMeta
  ])

  // Return object with state information
  return {
    isCategorical: currentIsCategorical,
    loading: cardinalityData.loading,
    error: cardinalityData.error
  }
}

/**
 * Bulk hook for accessing all isCategorical values
 * Use individual useIsCategorical(columnName) calls where possible for better performance
 */
export function useIsCategoricalBulk() {
  const isCategoricalColumns = useAppSelector((state) => state.columns.isCategorical)
  
  return { isCategoricalColumns }
}