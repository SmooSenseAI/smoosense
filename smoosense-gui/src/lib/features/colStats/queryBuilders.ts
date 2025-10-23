import type { RootState } from '@/lib/store'
import { extractSqlFilterFromState, getFilterTypeFromState } from '@/lib/utils/state/filterUtils'
import { FilterType } from '@/lib/features/filters/types'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { INVALID_COLUMN_NAME } from '@/lib/utils/columnNameUtils'

// Helper function to generate COUNT_IF equivalent for different engines
function countIf(condition: string, queryEngine: 'duckdb' | 'athena' | 'lance'): string {
  if (queryEngine === 'athena') {
    return `SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)`
  }
  return `COUNT_IF(${condition})`
}

// Helper function to generate CAST syntax for different engines
function cast(value: string, type: string, queryEngine: 'duckdb' | 'athena' | 'lance'): string {
  if (queryEngine === 'athena') {
    return `CAST(${value} AS ${type})`
  }
  // DuckDB supports both :: and CAST, but :: is more concise
  return `${value}::${type}`
}

// Helper to create struct/object - DuckDB uses STRUCT_PACK, Athena uses ROW
function structPack(fields: Record<string, string>, alias: string, queryEngine: 'duckdb' | 'athena' | 'lance'): string {
  if (queryEngine === 'athena') {
    // For Athena: use ROW() - backend will serialize to JSON object
    const values = Object.values(fields).join(', ')
    const fieldDefs = Object.keys(fields)
      .map((key) => `${key} DOUBLE`)  // Assume DOUBLE for numeric stats
      .join(', ')
    return `CAST(ROW(${values}) AS ROW(${fieldDefs})) AS ${alias}`
  }
  // DuckDB STRUCT_PACK with named fields
  const structFields = Object.entries(fields)
    .map(([key, value]) => `${key} := ${value}`)
    .join(', ')
  return `STRUCT_PACK(${structFields}) AS ${alias}`
}

// Helper function to build categorical stats query
export function buildCategoricalStatsQuery(
  columnName: string,
  tablePath: string,
  filterCondition?: string | null,
  queryEngine: 'duckdb' | 'athena' | 'lance' = 'duckdb'
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''

  // Format table reference: DuckDB uses quotes, Athena doesn't
  const tableRef = queryEngine === 'athena' ? tablePath : `'${tablePath}'`

  const cntNull = countIf(`${sanitizeName(columnName)} IS NULL`, queryEngine)

  // For Athena, use JSON strings; for DuckDB use STRUCT_PACK
  const rangeStruct = structPack({
    min: 'stats.min',
    max: 'stats.max'
  }, 'range', queryEngine)

  // Handle array aggregation differently for Athena vs DuckDB
  let arrayAgg: string

  if (queryEngine === 'athena') {
    // For Athena: return array of ROW structures (Python backend will serialize to JSON)
    arrayAgg = `ARRAY_AGG(CAST(ROW(value, cnt) AS ROW(value VARCHAR, cnt BIGINT))) AS cnt_values`
  } else {
    // For DuckDB: use STRUCT_PACK
    arrayAgg = `ARRAY_AGG(STRUCT_PACK(value:=value, cnt:=cnt)) AS cnt_values`
  }

  return `
    WITH filtered AS (
      SELECT * FROM ${tableRef} ${whereClause}
    ), stats AS (
      SELECT
        COUNT(*) AS cnt_all,
        ${cntNull} AS cnt_null,
        MIN(${sanitizeName(columnName)}) AS min,
        MAX(${sanitizeName(columnName)}) AS max
      FROM filtered
    ), bins AS (
      SELECT ${sanitizeName(columnName)} as value, COUNT(*) AS cnt
      FROM filtered WHERE ${sanitizeName(columnName)} IS NOT NULL
      GROUP BY ${sanitizeName(columnName)} ORDER BY cnt DESC
      LIMIT 1000
    ), grouped_bins AS (
      SELECT ${arrayAgg}
      FROM bins
    ) SELECT
      ${rangeStruct},
      cnt_values,
      stats.cnt_all,
      stats.cnt_null,
      stats.cnt_all - stats.cnt_null AS cnt_not_null
    FROM grouped_bins, stats
  `.trim()
}

// Helper function to build histogram stats query
export function buildHistogramStatsQuery(
  columnName: string,
  tablePath: string,
  histogramNumberOfBins: number,
  filterCondition?: string | null,
  queryEngine: 'duckdb' | 'athena' | 'lance' = 'duckdb'
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''

  // Format table reference: DuckDB uses quotes, Athena doesn't
  const tableRef = queryEngine === 'athena' ? tablePath : `'${tablePath}'`

  const cntNull = countIf(`${sanitizeName(columnName)} IS NULL`, queryEngine)

  // Handle array aggregation
  let arrayAgg: string
  if (queryEngine === 'athena') {
    // For Athena: return array of ROW structures (Python backend will serialize to JSON)
    arrayAgg = `ARRAY_AGG(CAST(ROW(bin_idx, cnt) AS ROW(binIdx BIGINT, cnt BIGINT))) AS cnt_values`
  } else {
    arrayAgg = `ARRAY_AGG(STRUCT_PACK(binIdx:=bin_idx, cnt:=cnt)) AS cnt_values`
  }

  // Athena doesn't support column references in same SELECT, need different approach
  if (queryEngine === 'athena') {
    // For Athena: calculate values in stats CTE, then reference them in final SELECT
    const colName = sanitizeName(columnName)
    const rawMin = `MIN(${colName})`
    const rawMax = `MAX(${colName})`
    const rawBins = histogramNumberOfBins
    const rawMinDouble = cast(rawMin, 'DOUBLE', queryEngine)
    const rawMaxDouble = cast(rawMax, 'DOUBLE', queryEngine)
    const rawStep = `CASE WHEN ${rawMin} = ${rawMax} THEN 1 ELSE (${rawMaxDouble} - ${rawMinDouble}) / (${rawBins} - 1) END`
    const roundTo = cast(`-FLOOR(LOG10(${rawStep}))`, 'INT', queryEngine)
    const niceStep = `ROUND(${rawStep}, ${roundTo})`
    const niceMin = `ROUND(FLOOR(${rawMin} / ${niceStep}) * ${niceStep}, ${roundTo})`
    const niceMax = `ROUND(CEIL(${rawMax} / ${niceStep}) * ${niceStep}, ${roundTo})`
    const niceBins = `((${niceMax} - ${niceMin}) / ${niceStep}) + 1`

    // In final SELECT, reference stats.* columns instead of recalculating
    const binStruct = structPack({
      min: 'stats.nice_min',
      max: 'stats.nice_max',
      count: 'stats.nice_bins',
      step: 'stats.nice_step',
      round_to: 'stats.round_to'
    }, 'bin', queryEngine)

    const rangeStruct = structPack({
      min: 'stats.raw_min',
      max: 'stats.raw_max'
    }, 'range', queryEngine)

    return `
      WITH filtered AS (
        SELECT * FROM ${tableRef} ${whereClause}
      ), stats AS (
        SELECT
          COUNT(*) AS cnt_all,
          ${cntNull} AS cnt_null,
          ${rawMin} AS raw_min,
          ${rawMax} AS raw_max,
          ${niceMin} AS nice_min,
          ${niceMax} AS nice_max,
          ${niceBins} AS nice_bins,
          ${niceStep} AS nice_step,
          ${roundTo} AS round_to
        FROM filtered
      ), bins AS (
        SELECT
          FLOOR((filtered.${colName} - stats.nice_min) / stats.nice_step) AS bin_idx,
          COUNT(*) AS cnt
        FROM
          filtered, stats
        WHERE filtered.${colName} IS NOT NULL
        GROUP BY 1 ORDER BY 1
      ), grouped_bins AS (
        SELECT ${arrayAgg}
        FROM bins
      )
      SELECT
        ${binStruct},
        ${rangeStruct},
        cnt_values,
        stats.cnt_all,
        stats.cnt_null,
        stats.cnt_all - stats.cnt_null AS cnt_not_null
      FROM grouped_bins, stats
    `.trim()
  }

  // DuckDB version - can use column references
  const rawMaxDouble = cast('raw_max', 'DOUBLE', queryEngine)
  const rawMinDouble = cast('raw_min', 'DOUBLE', queryEngine)
  const roundToInt = cast(`-FLOOR(LOG(raw_step))`, 'INT', queryEngine)

  const binStruct = structPack({
    min: 'stats.nice_min',
    max: 'stats.nice_max',
    count: 'stats.nice_bins',
    step: 'stats.nice_step',
    round_to: 'stats.round_to'
  }, 'bin', queryEngine)

  const rangeStruct = structPack({
    min: 'stats.raw_min',
    max: 'stats.raw_max'
  }, 'range', queryEngine)

  return `
    WITH filtered AS (
      SELECT * FROM ${tableRef} ${whereClause}
    ), stats AS (
      SELECT
        COUNT(*) AS cnt_all,
        ${cntNull} AS cnt_null,
        MIN(${sanitizeName(columnName)}) AS raw_min,
        MAX(${sanitizeName(columnName)}) AS raw_max,
        ${histogramNumberOfBins} AS raw_bins,
        CASE WHEN raw_min = raw_max THEN 1 ELSE (${rawMaxDouble} - ${rawMinDouble}) / (raw_bins - 1) END AS raw_step,
        ${roundToInt} AS round_to,
        ROUND(raw_step, round_to) AS nice_step,
        ROUND(FLOOR(raw_min / nice_step) * nice_step, round_to) AS nice_min,
        ROUND(CEIL(raw_max / nice_step) * nice_step, round_to) AS nice_max,
        ((nice_max - nice_min) / nice_step) + 1 AS nice_bins
      FROM filtered
    ), bins AS (
      SELECT
        FLOOR((${sanitizeName(columnName)} - stats.nice_min) / stats.nice_step) AS bin_idx,
        COUNT(*) AS cnt
      FROM
        filtered, stats
      WHERE ${sanitizeName(columnName)} IS NOT NULL
      GROUP BY 1 ORDER BY 1
    ), grouped_bins AS (
      SELECT ${arrayAgg}
      FROM bins
    )
    SELECT
      ${binStruct},
      ${rangeStruct},
      cnt_values,
      stats.cnt_all,
      stats.cnt_null,
      stats.cnt_all - stats.cnt_null AS cnt_not_null
    FROM grouped_bins, stats
  `.trim()
}

// Helper function to build text stats query
export function buildTextStatsQuery(
  columnName: string,
  tablePath: string,
  filterCondition?: string | null,
  queryEngine: 'duckdb' | 'athena' | 'lance' = 'duckdb'
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''

  // Format table reference: DuckDB uses quotes, Athena doesn't
  const tableRef = queryEngine === 'athena' ? tablePath : `'${tablePath}'`

  const cntNull = countIf(`${sanitizeName(columnName)} IS NULL`, queryEngine)

  const rangeStruct = structPack({
    min: `MIN(${sanitizeName(columnName)})`,
    max: `MAX(${sanitizeName(columnName)})`
  }, 'range', queryEngine)

  // Empty array for text stats
  const emptyArray = queryEngine === 'athena' ? `ARRAY[]` : '[]'

  return `
    SELECT
      ${rangeStruct},
      ${emptyArray} AS cnt_values,
      COUNT(*) AS cnt_all,
      ${cntNull} AS cnt_null,
      COUNT(*) - (${cntNull}) AS cnt_not_null
    FROM ${tableRef}
    ${whereClause}
  `.trim()
}

// Utility function to build query from Redux state
export function buildColStatsQueryFromState({
  columnName,
  addFilter,
  state
}: {
  columnName: string
  addFilter: boolean
  state: RootState
}): string {
  // Validate column name first
  if (!columnName || columnName.trim() === '' || columnName === INVALID_COLUMN_NAME) {
    throw new Error('Invalid column name provided to buildColStatsQueryFromState')
  }

  // Get table path from UI state
  const tablePath = state.ui.tablePath
  if (!tablePath) {
    throw new Error('No table path found in state')
  }

  // Get query engine from UI state
  const queryEngine = state.ui.queryEngine

  // Get histogram bins from UI state
  let histogramNumberOfBins = state.ui.histogramNumberOfBins

  // Get distinct count from cardinality data if available
  const cardinalityData = state.columns.cardinality[columnName]?.data
  const distinctCount = cardinalityData?.cntD

  // Use the smaller value between distinctCount and histogramNumberOfBins for histogram queries
  if (distinctCount !== null && distinctCount !== undefined && distinctCount > 0) {
    histogramNumberOfBins = Math.min(histogramNumberOfBins, distinctCount)
  }

  // Get filters if needed
  const whereClause = addFilter ? extractSqlFilterFromState(state) : null

  // Determine filter type using utility function
  const filterType = getFilterTypeFromState(columnName, state)

  // Build and return appropriate query
  if (filterType === FilterType.ENUM) {
    return buildCategoricalStatsQuery(columnName, tablePath, whereClause, queryEngine)
  } else if (filterType === FilterType.RANGE) {
    return buildHistogramStatsQuery(columnName, tablePath, histogramNumberOfBins, whereClause, queryEngine)
  } else {
    // TEXT or NONE - default to text query
    return buildTextStatsQuery(columnName, tablePath, whereClause, queryEngine)
  }
}