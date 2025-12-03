import _ from 'lodash'
import { computeTypeShortcuts, type TypeShortcuts } from '@/lib/utils/duckdbTypes'
import { isStructType, flattenStructFields, isHuggingFaceMediaType } from '@/lib/utils/structParser'
import { isFloatArrayType, getEmbeddingDimensions } from '@/lib/utils/sql/emb'
import { addExecution } from '@/lib/features/sqlHistory/sqlHistorySlice'
import { API_PREFIX } from '@/lib/utils/urlUtils'
import { getTableStats } from './stats'
import type { AppDispatch } from '@/lib/store'


interface QueryResult {
  column_names: string[]
  rows: (string | number | boolean | null)[][]
  runtime: number
  status: 'running' | 'success' | 'error'
  error?: string
}

// Specific types for transformed results
type RowObject = Record<string, string | number | boolean | null> & { rowIndex: number }
type DictOfList = Record<string, (string | number | boolean | null)[]>

interface Stats {
  min: string | number | null
  max: string | number | null
  cntAll: number
  cntNull: number
  hasNull: boolean
  singleValue: boolean // true if min = max != null
  allNull: boolean // true if cntNull === cntAll
}

interface ColumnMeta {
  column_name: string
  duckdbType: string
  typeShortcuts: TypeShortcuts
  stats: Stats | null
  embDim: number | null
}


export async function executeQuery(
  sqlQuery: string,
  sqlKey: string,
  dispatch: AppDispatch,
  queryEngine: string,
  tablePath: string
): Promise<QueryResult> {
  if (!sqlQuery.trim()) {
    throw new Error('Query cannot be empty')
  }

  // Save running status at start
  const runningResult: QueryResult = {
    column_names: [],
    rows: [],
    runtime: 0,
    status: 'running'
  }
  dispatch(addExecution({ sqlKey, query: sqlQuery.trim(), result: runningResult }))

  const requestData = {
    query: sqlQuery.trim(),
    queryEngine,
    tablePath
  }

  // Executing SQL query

  try {
    const response = await fetch(`${API_PREFIX}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Save successful result to Redux store
    dispatch(addExecution({ sqlKey, query: sqlQuery.trim(), result: data }))
    
    return data
  } catch (error) {
    // Query execution failed
    const errorResult: QueryResult = {
      column_names: [],
      rows: [],
      runtime: 0,
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
    
    // Save error result to Redux store
    dispatch(addExecution({ sqlKey, query: sqlQuery.trim(), result: errorResult }))
    
    return errorResult
  }
}

export async function executeQueryAsListOfDict(
  sqlQuery: string,
  sqlKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  queryEngine: string,
  tablePath: string
): Promise<RowObject[]> {
  const rawResult = await executeQuery(sqlQuery, sqlKey, dispatch, queryEngine, tablePath)

  if (rawResult.status === 'error') {
    throw new Error(rawResult.error || 'Query failed')
  }

  return rawResult.rows.map((row, index) => ({
    ..._.zipObject(rawResult.column_names, row),
    rowIndex: index
  })) as RowObject[]
}

export async function executeQueryAsDictOfList(
  sqlQuery: string,
  sqlKey: string,
  dispatch: AppDispatch,
  queryEngine: string,
  tablePath: string
): Promise<DictOfList> {
  const rawResult = await executeQuery(sqlQuery, sqlKey, dispatch, queryEngine, tablePath)

  if (rawResult.status === 'error') {
    throw new Error(rawResult.error || 'Query failed')
  }

  return _.zipObject(
    rawResult.column_names,
    _.zip(...rawResult.rows)
  ) as DictOfList
}

export async function getColumnMetadata(
  tablePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  queryEngine: string
): Promise<ColumnMeta[]> {
  if (!tablePath.trim()) {
    throw new Error('Table path cannot be empty')
  }

  // Use lance_table when queryEngine is lance, otherwise use tablePath
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`
  const metaQuery = `SELECT column_name, column_type FROM (DESCRIBE SELECT * FROM ${tableRef})`
  const rows = await executeQueryAsListOfDict(metaQuery, `column_metadata`, dispatch, queryEngine, tablePath)

  // Get stats if available (Lance, Parquet, or row-based tables)
  const stats = await getTableStats(tablePath, dispatch, queryEngine)

  // Find candidate columns for embedding dimension check
  const embCandidates: string[] = []
  for (const row of rows) {
    const columnName = String(row.column_name)
    const duckdbType = String(row.column_type)
    if (isFloatArrayType(duckdbType)) {
      embCandidates.push(columnName)
    }
  }

  // Get embedding dimensions for candidate columns
  const embDims = await getEmbeddingDimensions(tablePath, dispatch, queryEngine, embCandidates)

  const columns: ColumnMeta[] = []

  for (const row of rows) {
    const columnName = String(row.column_name)
    const duckdbType = String(row.column_type)

    // Add the original column
    columns.push({
      column_name: columnName,
      duckdbType,
      typeShortcuts: computeTypeShortcuts(duckdbType),
      stats: stats?.[columnName] || null,
      embDim: embDims[columnName] ?? null
    })

    // If it's a struct type (but not HuggingFace media), flatten the fields and add them as separate columns
    if (isStructType(duckdbType) && !isHuggingFaceMediaType(duckdbType)) {
      try {
        const flattenedFields = flattenStructFields(columnName, duckdbType)

        for (const field of flattenedFields) {
          columns.push({
            column_name: field.column_name,
            duckdbType: field.duckdbType,
            typeShortcuts: computeTypeShortcuts(field.duckdbType),
            stats: stats?.[field.column_name] || null,
            embDim: null
          })
        }
      } catch (error) {
          console.error(error)
        // Failed to parse struct type
      }
    }
  }


  return columns
}

/**
 * Generate a unique SQL key based on timestamp and random string
 */
export function generateSqlKey(prefix = 'sql'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

export type { 
  QueryResult, 
  RowObject, 
  DictOfList, 
  ColumnMeta,
  Stats
}