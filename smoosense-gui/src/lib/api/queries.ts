import _ from 'lodash'
import { computeTypeShortcuts, type TypeShortcuts } from '@/lib/utils/duckdbTypes'
import { isStructType, flattenStructFields } from '@/lib/utils/structParser'
import { addExecution } from '@/lib/features/sqlHistory/sqlHistorySlice'
import { API_PREFIX } from '@/lib/utils/urlUtils'
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

async function getLanceStats(tablePath: string, dispatch: AppDispatch, queryEngine: string): Promise<Record<string, Stats> | null> {
  // Only get stats for Lance tables
  if (queryEngine !== 'lance') {
    return null
  }

  try {
    const statsQuery = `SUMMARIZE SELECT * FROM lance_table`

    const rows = await executeQueryAsListOfDict(statsQuery, `lance_stats`, dispatch, queryEngine, tablePath)
    const statsMap: Record<string, Stats> = {}

    for (const row of rows) {
      const columnName = String(row.column_name)
      const min = row.min === null || typeof row.min === 'boolean' ? null : row.min
      const max = row.max === null || typeof row.max === 'boolean' ? null : row.max
      const count = Number(row.count || 0)
      const nullPercentage = Number(row.null_percentage || 0)
      const cntNull = Math.round((nullPercentage / 100) * count)
      const cntAll = count

      statsMap[columnName] = {
        min,
        max,
        cntAll,
        cntNull,
        hasNull: cntNull > 0,
        singleValue: min !== null && max !== null && min === max,
        allNull: cntNull === cntAll
      }
    }

    return statsMap
  } catch (error) {
    // Failed to get Lance stats
    console.error(error)
    return null
  }
}

async function getParquetStats(tablePath: string, dispatch: AppDispatch, queryEngine: string): Promise<Record<string, Stats> | null> {
  // Check if the file is a Parquet file
  if (!tablePath.toLowerCase().endsWith('.parquet')) {
    return null
  }

  // Don't get parquet stats for Lance tables
  if (queryEngine === 'lance') {
    return null
  }

  try {
    const statsQuery = `
      SELECT
        REPLACE(path_in_schema, ', ', '.') AS column_name,
        SUM(num_values) AS cntAll,
        MIN(stats_min_value) AS min,
        MAX(stats_max_value) AS max,
        -- Sometimes parquet metadata may be wrong for columns with all null values
        (CASE WHEN (MIN(stats_min_value) IS NULL AND MAX(stats_max_value) IS NULL)
         THEN SUM(num_values)
         ELSE SUM(stats_null_count) END) AS cntNull
      FROM parquet_metadata('${tablePath}')
      GROUP BY path_in_schema
    `

    const rows = await executeQueryAsListOfDict(statsQuery, `parquet_stats`, dispatch, queryEngine, tablePath)
    const statsMap: Record<string, Stats> = {}

    for (const row of rows) {
      const columnName = String(row.column_name)
      const min = row.min === null || typeof row.min === 'boolean' ? null : row.min
      const max = row.max === null || typeof row.max === 'boolean' ? null : row.max
      const cntAll = Number(row.cntAll)
      const cntNull = Number(row.cntNull)

      statsMap[columnName] = {
        min,
        max,
        cntAll,
        cntNull,
        hasNull: cntNull > 0,
        singleValue: min !== null && max !== null && min === max,
        allNull: cntNull === cntAll
      }
    }

    return statsMap
  } catch (error) {
    // Failed to get Parquet stats
      console.error(error)
    return null
  }
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

  // Get stats if available (Lance or Parquet)
  const lanceStats = await getLanceStats(tablePath, dispatch, queryEngine)
  const parquetStats = await getParquetStats(tablePath, dispatch, queryEngine)
  const stats = lanceStats || parquetStats

  const columns: ColumnMeta[] = []

  for (const row of rows) {
    const columnName = String(row.column_name)
    const duckdbType = String(row.column_type)

    // Add the original column
    columns.push({
      column_name: columnName,
      duckdbType,
      typeShortcuts: computeTypeShortcuts(duckdbType),
      stats: stats?.[columnName] || null
    })

    // If it's a struct type, flatten the fields and add them as separate columns
    if (isStructType(duckdbType)) {
      try {
        const flattenedFields = flattenStructFields(columnName, duckdbType)

        for (const field of flattenedFields) {
          columns.push({
            column_name: field.column_name,
            duckdbType: field.duckdbType,
            typeShortcuts: computeTypeShortcuts(field.duckdbType),
            stats: stats?.[field.column_name] || null
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