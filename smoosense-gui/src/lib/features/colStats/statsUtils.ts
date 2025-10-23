import { executeQueryAsListOfDict, generateSqlKey } from '@/lib/api/queries'
import type { AppDispatch } from '@/lib/store'
import { FilterType } from '@/lib/features/filters/types'
import { padItems } from './utils'
import type {
  ColumnStats,
  CategoricalStats,
  HistogramStats,
  TextStats
} from './types'

// Helper to parse JSON if string, otherwise return as-is
function parseIfJson<T>(value: unknown): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  }
  return value as T
}

// Result transformers
const categoricalTransformer = (result: Record<string, unknown>[]) => {
  const data = result[0]
  return {
    ...data,
    range: parseIfJson(data.range),
    cnt_values: parseIfJson(data.cnt_values)
  }
}

const histogramTransformer = (result: Record<string, unknown>[]) => {
  const data = result[0]
  const bin = parseIfJson<{ min: number; step: number; round_to: number; max: number; count: number }>(data.bin)
  const { min, step, round_to } = bin
  const rawCntValues = parseIfJson<Array<{ binIdx: number; cnt?: number }>>(data.cnt_values)
  const cnt_values = padItems({
    min,
    step,
    round_to,
    cntValues: rawCntValues
  })
  return {
    ...data,
    bin,
    range: parseIfJson(data.range),
    cnt_values
  }
}

const textTransformer = (result: Record<string, unknown>[]) => {
  const data = result[0]
  return {
    ...data,
    range: parseIfJson(data.range),
    cnt_values: [] // Ensure empty array for text stats
  }
}


/**
 * Transforms raw query results into typed ColumnStats based on the FilterType
 */
export function transformStatsResult(
  result: Record<string, unknown>[],
  filterType: FilterType
): ColumnStats {
  let stats: ColumnStats

  if (filterType === FilterType.ENUM) {
    const transformedResult = categoricalTransformer(result)
    stats = {
      type: FilterType.ENUM,
      ...transformedResult
    } as CategoricalStats
  } else if (filterType === FilterType.RANGE) {
    const transformedResult = histogramTransformer(result)
    stats = {
      type: FilterType.RANGE,
      ...transformedResult
    } as HistogramStats
  } else {
    // text or none - default to text behavior
    const transformedResult = textTransformer(result)
    stats = {
      type: FilterType.TEXT,
      ...transformedResult
    } as TextStats
  }

  return stats
}

/**
 * Common logic for querying column statistics
 */
export async function queryColumnStats({
  columnName,
  dispatch,
  keyPrefix,
  sqlQuery,
  filterType,
  queryEngine = 'duckdb'
}: {
  columnName: string
  dispatch: AppDispatch
  keyPrefix: string
  sqlQuery: string
  filterType: FilterType
  queryEngine?: 'duckdb' | 'athena' | 'lance'
}): Promise<{ columnName: string; stats: ColumnStats }> {
  // Set up timeout controller
  const controller = new AbortController()

  try {
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 15000) // 15 second timeout

    const sqlKey = generateSqlKey(`${keyPrefix}_${columnName}`)
    const result = await executeQueryAsListOfDict(sqlQuery, sqlKey, dispatch, queryEngine)
    clearTimeout(timeoutId)

    if (controller.signal.aborted) {
      throw new Error('Query timeout after 15 seconds')
    }

    if (result.length === 0) {
      throw new Error('No results returned')
    }

    const stats = transformStatsResult(result, filterType)

    return {
      columnName,
      stats
    }
  } catch (error) {
    if (controller.signal?.aborted || (error instanceof Error && error.message.includes('timeout'))) {
      throw new Error('Query timeout after 15 seconds')
    }
    throw error
  }
}

/**
 * Helper functions for type-safe getters (can be used in hooks)
 */
export function getCategoricalStats(data: ColumnStats | null): CategoricalStats | null {
  return data?.type === FilterType.ENUM ? data as CategoricalStats : null
}

export function getHistogramStats(data: ColumnStats | null): HistogramStats | null {
  return data?.type === FilterType.RANGE ? data as HistogramStats : null
}

export function getTextStats(data: ColumnStats | null): TextStats | null {
  return data?.type === FilterType.TEXT ? data as TextStats : null
}

