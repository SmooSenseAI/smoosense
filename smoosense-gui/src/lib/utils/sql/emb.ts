import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { sanitizeName } from './helpers'

/**
 * Check if a DuckDB type is a float or double array (potential embedding)
 */
export function isFloatArrayType(duckdbType: string): boolean {
  const upper = duckdbType.toUpperCase().trim()
  return upper === 'FLOAT[]' || upper === 'DOUBLE[]'
}

/**
 * Get embedding dimensions for float/double array columns
 * Returns a map of column name to dimension (or null if not a fixed-length embedding)
 */
export async function getEmbeddingDimensions(
  tablePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  queryEngine: string,
  candidateColumns: string[]
): Promise<Record<string, number | null>> {
  if (candidateColumns.length === 0) {
    return {}
  }

  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  // Build UNION query for all candidate columns
  const unionParts = candidateColumns.map(col => {
    const sanitizedCol = sanitizeName(col)
    return `
      SELECT
        '${col}' AS columnName,
        MAX(array_length(${sanitizedCol})) AS maxLength,
        MIN(array_length(${sanitizedCol})) AS minLength,
        (MAX(array_length(${sanitizedCol})) = MIN(array_length(${sanitizedCol}))
          AND MAX(array_length(${sanitizedCol})) > 10) AS isEmb
      FROM ${tableRef}
    `
  })
  const query = unionParts.join(' UNION ')

  try {
    const rows = await executeQueryAsListOfDict(query, 'embedding_dimensions', dispatch, queryEngine, tablePath)

    const result: Record<string, number | null> = {}
    for (const row of rows) {
      const columnName = String(row.columnName)
      const maxLength = row.maxLength !== null ? Number(row.maxLength) : null
      const isEmb = row.isEmb === true

      // Only set embDim if isEmb is true (fixed-length embedding with length > 10)
      if (isEmb && maxLength !== null) {
        result[columnName] = maxLength
      } else {
        result[columnName] = null
      }
    }
    return result
  } catch (error) {
    console.error('Failed to get embedding dimensions:', error)
    return {}
  }
}
