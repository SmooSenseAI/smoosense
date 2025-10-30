import type { RootState } from '@/lib/store'
import { extractSqlFilterFromState, getFilterTypeFromState } from '@/lib/utils/state/filterUtils'
import { FilterType } from '@/lib/features/filters/types'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { INVALID_COLUMN_NAME } from '@/lib/utils/columnNameUtils'

// Helper function to build categorical stats query
export function buildCategoricalStatsQuery(
  columnName: string,
  tablePath: string,
  filterCondition: string | null | undefined,
  queryEngine: string
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  return `
    WITH filtered AS (
      SELECT * FROM ${tableRef} ${whereClause}
    ), stats AS (
      SELECT
        COUNT(*) AS cnt_all,
        COUNT_IF(${sanitizeName(columnName)} IS NULL) AS cnt_null,
        MIN(${sanitizeName(columnName)}) AS min,
        MAX(${sanitizeName(columnName)}) AS max
      FROM filtered
    ), bins AS (
      SELECT ${sanitizeName(columnName)} as value, COUNT(*) AS cnt
      FROM filtered WHERE ${sanitizeName(columnName)} IS NOT NULL
      GROUP BY ${sanitizeName(columnName)} ORDER BY cnt DESC
      LIMIT 1000
    ), grouped_bins AS (
      SELECT ARRAY_AGG(STRUCT_PACK(value:=value, cnt:=cnt)) AS cnt_values
      FROM bins
    ) SELECT
      STRUCT_PACK(
        min := stats.min,
        max := stats.max
      ) AS range,
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
  filterCondition: string | null | undefined,
  queryEngine: string
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  return `
    WITH filtered AS (
      SELECT * FROM ${tableRef} ${whereClause}
    ), stats AS (
      SELECT
        COUNT(*) AS cnt_all,
        COUNT_IF(${sanitizeName(columnName)} IS NULL) AS cnt_null,
        MIN(${sanitizeName(columnName)}) AS raw_min,
        MAX(${sanitizeName(columnName)}) AS raw_max,
        ${histogramNumberOfBins} AS raw_bins,
        CASE WHEN raw_min = raw_max THEN 1 ELSE (raw_max::DOUBLE - raw_min::DOUBLE) / (raw_bins - 1) END AS raw_step,
        -FLOOR(LOG(raw_step))::INT AS round_to,
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
      SELECT ARRAY_AGG(STRUCT_PACK(binIdx:=bin_idx, cnt:=cnt)) AS cnt_values
      FROM bins
    )
    SELECT
      STRUCT_PACK(
        min := stats.nice_min,
        max := stats.nice_max,
        count := stats.nice_bins,
        step := stats.nice_step,
        round_to := stats.round_to
      ) AS bin,
      STRUCT_PACK(
        min := stats.raw_min,
        max := stats.raw_max
      ) AS range,
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
  filterCondition: string | null | undefined,
  queryEngine: string
): string {
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  return `
    SELECT
      STRUCT_PACK(
        min := MIN(${sanitizeName(columnName)}),
        max := MAX(${sanitizeName(columnName)})
      ) AS range,
      [] AS cnt_values,
      COUNT(*) AS cnt_all,
      COUNT_IF(${sanitizeName(columnName)} IS NULL) AS cnt_null,
      COUNT(*) - COUNT_IF(${sanitizeName(columnName)} IS NULL) AS cnt_not_null
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