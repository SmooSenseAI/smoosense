import type { AppDispatch } from '@/lib/store'
import type { Stats } from '../queries'
import { executeQueryAsListOfDict } from '../queries'

export async function getLanceStats(tablePath: string, dispatch: AppDispatch, queryEngine: string): Promise<Record<string, Stats> | null> {
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
