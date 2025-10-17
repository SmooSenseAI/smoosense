import jsonata from 'jsonata'
import { keys, map, zipObject } from 'lodash'
import type { DerivedColumn } from '@/lib/features/derivedColumns/derivedColumnsSlice'

/**
 * Evaluates a single JSONata expression against row data
 * @param expr - JSONata expression string
 * @param singleRowData - Single row of data
 * @returns Promise<string> - Evaluated result as string
 */
const evaluateExpr = async ({ expr, singleRowData }: {
  expr: string
  singleRowData: Record<string, unknown>
}): Promise<string> => {
  const result = await jsonata(expr).evaluate(singleRowData)
  if (typeof result === 'object') {
    return JSON.stringify(result)
  } else {
    return String(result || '')
  }
}

/**
 * Evaluates a dictionary of JSONata expressions
 * @param params - Object with expression values
 * @param singleRowData - Single row of data
 * @returns Promise<Record<string, string>> - Evaluated parameters
 */
export const evaluateDictExpressions = async ({ params, singleRowData }: {
  params: Record<string, string>
  singleRowData: Record<string, unknown>
}): Promise<Record<string, string>> => {
  const paramKeys = keys(params)
  const promises = map(paramKeys, (key) => evaluateExpr({ expr: params[key], singleRowData }))
  const results = await Promise.all(promises)
  return zipObject(paramKeys, results)
}

/**
 * Creates a full URL from base URL and parameters
 * @param baseUrl - Base URL string
 * @param params - URL parameters
 * @returns Full URL string
 */
const toFullUrl = ({ baseUrl, params }: {
  baseUrl: string
  params: Record<string, string>
}): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl
  }
  
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  
  return url.toString()
}

/**
 * Evaluates all derived column expressions for all rows of data
 * @param derivedColumns - Array of derived column definitions
 * @param rowData - Array of row data objects
 * @returns Promise<Record<string, unknown>[]> - Enriched row data with derived column values
 */
export async function evaluateAllExpressionsForAllRows({
  derivedColumns,
  rowData
}: {
  derivedColumns: DerivedColumn[]
  rowData: Record<string, unknown>[]
}): Promise<Record<string, unknown>[]> {
  
  // If no derived columns, return original data
  if (!derivedColumns || derivedColumns.length === 0) {
    return rowData
  }
  
  for (const row of rowData) {
    for (const col of derivedColumns) {
      if (col.expression) {
        // Direct JSONata expression evaluation
        try {
          const result = await evaluateExpr({ expr: col.expression, singleRowData: row })
          row[col.name] = result
        } catch (error) {
          console.error('Error evaluating JSONata expression:', col.expression, error)
          row[col.name] = ''
        }
      } else if (col.params && col.baseUrl) {
        // Parameter-based URL construction
        try {
          const evaluatedParams = await evaluateDictExpressions({ params: col.params, singleRowData: row })
          const fullUrl = toFullUrl({ baseUrl: col.baseUrl, params: evaluatedParams })
          row[col.name] = fullUrl
        } catch (error) {
          console.error('Error evaluating derived column parameters:', col.params, error)
          row[col.name] = col.baseUrl || ''
        }
      } else {
        row[col.name] = ''
      }
    }
  }
  
  return rowData
}

