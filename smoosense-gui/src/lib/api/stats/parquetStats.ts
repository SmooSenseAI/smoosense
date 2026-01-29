import type { AppDispatch } from '@/lib/store'
import type { Stats } from '../queries'
import { executeQueryAsListOfDict } from '../queries'

export async function getParquetStats(tablePath: string, dispatch: AppDispatch): Promise<Record<string, Stats> | null> {
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

    const rows = await executeQueryAsListOfDict(statsQuery, `parquet_stats`, dispatch)
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
