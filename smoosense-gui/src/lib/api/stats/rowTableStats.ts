import type { AppDispatch } from '@/lib/store'
import type { Stats } from '../queries'
import { executeQueryAsListOfDict } from '../queries'
import { getFileType, FileType } from '@/lib/utils/fileTypes'

export async function getRowTableStats(tablePath: string, dispatch: AppDispatch): Promise<Record<string, Stats> | null> {
  // Check if the file is a row-based table that DuckDB can query directly
  const fileType = getFileType(tablePath)

  // Only process RowTable types
  if (fileType !== FileType.RowTable) {
    return null
  }

  try {
    const statsQuery = `SUMMARIZE SELECT * FROM '${tablePath}'`

    const rows = await executeQueryAsListOfDict(statsQuery, `row_table_stats`, dispatch)
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
    // Failed to get row table stats
    console.error(error)
    return null
  }
}
