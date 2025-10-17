import { isNil } from 'lodash'
import { sanitizeValue, sanitizeName } from './helpers'
import type { ColumnFilter, NullFilterOption } from '@/lib/features/colDefs/agSlice'
import { FilterType } from '@/lib/features/filters/types'

/**
 * Map UI null filter options to SQL values
 * UI uses: 'Include' | 'Exclude' | 'Only Null' | 'N/A'
 * SQL expects: 'include' | 'exclude' | 'only' | 'N/A'
 */
const mapNullFilterToSql = (nullFilter: NullFilterOption): string => {
  switch (nullFilter) {
    case 'Include':
      return 'include'
    case 'Exclude':
      return 'exclude'
    case 'Only Null':
      return 'only'
    case 'N/A':
      return 'N/A'
    default:
      throw new Error(`Unknown null filter: ${nullFilter}`)
  }
}

/**
 * Parse text filter to SQL expression. Return null if the filter is not necessary.
 */
const parseTextFilter = (name: string, item: ColumnFilter): string | null => {
  const { contains, null: filterNull } = item
  if (isNil(contains) || contains === '') {
    return combineWithFilterNull(name, null, filterNull)
  } else {
    const expr = `CAST(${sanitizeName(name)} AS VARCHAR) LIKE '%${contains}%'`
    return combineWithFilterNull(name, expr, filterNull)
  }
}

/**
 * Parse enum filter to SQL expression
 */
const parseEnumFilter = (name: string, item: ColumnFilter): string | null => {
  const { including, null: filterNull } = item
  if (isNil(including) || including.length === 0) {
    return combineWithFilterNull(name, null, filterNull)
  } else {
    const expr = `${sanitizeName(name)} IN ${sanitizeValue(including)}`
    return combineWithFilterNull(name, expr, filterNull)
  }
}

/**
 * Parse range filter to SQL expression
 */
const parseRangeFilter = (name: string, item: ColumnFilter): string | null => {
  const { range, null: filterNull } = item
  if (isNil(range)) {
    return combineWithFilterNull(name, null, filterNull)
  } else if (!Array.isArray(range) || range.length !== 2 || range.some(v => typeof v !== 'number')) {
    throw new Error(`Invalid range: ${range}`)
  } else {
    const rangeExpr = `${sanitizeName(name)} BETWEEN ${range[0]} AND ${range[1]}`
    return combineWithFilterNull(name, rangeExpr, filterNull)
  }
}

/**
 * Combine filter expression with null filter logic
 */
const combineWithFilterNull = (name: string, expr: string | null, filterNull: NullFilterOption): string | null => {
  const sqlNullFilter = mapNullFilterToSql(filterNull)
  
  switch (sqlNullFilter) {
    case 'include':
      return expr ? `${expr} OR ${sanitizeName(name)} IS NULL` : null
    case 'exclude':
      return expr ? `${expr}` : `${sanitizeName(name)} IS NOT NULL`
    case 'only':
      return `${sanitizeName(name)} IS NULL`
    case 'N/A':
      return expr
    default:
      throw new Error(`Unknown null filter: ${sqlNullFilter}`)
  }
}

/**
 * Parse a ColumnFilter to SQL WHERE condition string
 * @param name - Column name
 * @param item - ColumnFilter object
 * @returns SQL WHERE condition string or null if no filter needed
 */
export const parseFilterItem = (name: string, item: ColumnFilter): string | null => {
  const { filterType, null: filterNull } = item
  
  if (isNil(filterNull)) {
    throw new Error(`Null filter is required for ${name}`)
  }
  
  switch (filterType) {
    case FilterType.TEXT:
      return parseTextFilter(name, item)
    case FilterType.ENUM:
      return parseEnumFilter(name, item)
    case FilterType.RANGE:
      return parseRangeFilter(name, item)
    default:
      throw new Error(`Unknown filter type: ${filterType}`)
  }
}

/**
 * Convert a filters dictionary to a SQL WHERE condition
 * @param filters - Dictionary of column names to ColumnFilter objects
 * @returns SQL WHERE condition string combining all filters with AND
 */
export const toSqlCondition = (filters: Record<string, ColumnFilter | null>): string => {
  const sqlList = Object.entries(filters).map(([columnName, filterItem]) => {
    try {
      if (filterItem === null) {
        return null
      }
      const sql = parseFilterItem(columnName, filterItem)
      return sql
    } catch (error) {
      console.error(`Error parsing filter for column ${columnName}:`, error)
      return null
    }
  })

  const expr = sqlList.filter(Boolean).map(sql => `(${sql})`).join(' AND ')
  return expr
}