import type { RootState } from '@/lib/store'
import { toSqlCondition } from '@/lib/utils/sql/parseFilters'
import { FilterType } from '@/lib/features/filters/types'

/**
 * Extracts SQL filter condition from Redux state
 * 
 * @param state - Redux root state
 * @returns SQL WHERE clause string or null if no filters are active
 */
export function extractSqlFilterFromState(state: RootState): string | null {
  const filters = state.ag.filters
  
  // Return null if no filters are set
  if (!filters || Object.keys(filters).length === 0) {
    return null
  }

  // Normalize filter values (convert undefined to null)
  const normalizedFilters = Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, value ?? null])
  )

  // Convert to SQL condition
  return toSqlCondition(normalizedFilters)
}


/**
 * Determines the FilterType for a specific column based on Redux state
 * 
 * @param columnName - The name of the column to determine filter type for
 * @param state - Redux root state
 * @returns FilterType for the column (ENUM, RANGE, TEXT, or NONE)
 */
export function getFilterTypeFromState(columnName: string, state: RootState): FilterType {
  // Get column metadata
  const columnMeta = state.columnMeta.data?.find(col => col.column_name === columnName)
  
  if (!columnMeta) {
    return FilterType.NONE
  }
  
  // Get categorical preference
  const isCategoricalValue = state.columns.isCategorical[columnName]
  
  // Apply filter type logic
  const { isNumeric, isString } = columnMeta.typeShortcuts
  const isCategorical = isCategoricalValue === true

  if (isCategorical) {
    // Categorical/enum filter for any type when marked as categorical
    return FilterType.ENUM
  } else if (isNumeric) {
    // Range filter for numeric non-categorical
    return FilterType.RANGE
  } else if (isString) {
    // Text filter for non-categorical text
    return FilterType.TEXT
  } else {
    return FilterType.NONE
  }
}

