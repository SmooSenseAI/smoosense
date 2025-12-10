import { API_PREFIX } from '@/lib/utils/urlUtils'
import { postApi } from '@/lib/utils/apiUtils'

export interface LanceIndexInfo {
  name: string
  index_type: string
  columns: string[]
  num_unindexed_rows: number | null
}

/**
 * Fetch Lance indices for a table by dbPath and tableName.
 * @param dbPath - Path to the Lance database directory
 * @param tableName - Name of the table
 * @returns List of index info, or empty array on error
 */
export async function fetchLanceIndicesByName(
  dbPath: string,
  tableName: string
): Promise<LanceIndexInfo[]> {
  try {
    const params = new URLSearchParams({
      dbPath,
      tableName,
      dbType: 'lance'
    })
    const response = await fetch(`${API_PREFIX}/lance/list-indices?${params}`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  } catch {
    return []
  }
}

/**
 * Fetch Lance indices for a table by table path.
 * @param tablePath - Path to the Lance table (e.g., /path/to/db/table.lance)
 * @returns List of index info, or empty array if not a Lance table or on error
 */
async function fetchLanceIndices(tablePath: string): Promise<LanceIndexInfo[]> {
  // Extract dbPath and tableName from tablePath
  // tablePath format: /path/to/db/table_name.lance
  if (!tablePath.endsWith('.lance')) {
    return []
  }

  const lastSlash = tablePath.lastIndexOf('/')
  if (lastSlash === -1) {
    return []
  }

  const dbPath = tablePath.substring(0, lastSlash)
  const tableNameWithExt = tablePath.substring(lastSlash + 1)
  const tableName = tableNameWithExt.replace('.lance', '')

  return fetchLanceIndicesByName(dbPath, tableName)
}

/**
 * Get embedding column names from Lance indices.
 * Embedding columns are identified by IvfPq index type.
 * @param tablePath - Path to the Lance table (e.g., /path/to/db/table.lance)
 * @returns Set of column names that are embeddings
 */
export async function getEmbeddingColumns(tablePath: string): Promise<Set<string>> {
  const embeddingColumns = new Set<string>()
  const indices = await fetchLanceIndices(tablePath)

  // IvfPq indices are used for vector search, their columns are embeddings
  for (const index of indices) {
    if (['IvfPq'].includes(index.index_type)) {
      for (const col of index.columns) {
        embeddingColumns.add(col)
      }
    }
  }

  return embeddingColumns
}

export interface VectorSearchParams {
  tablePath: string
  embedding: number[]
  vectorColumn: string
  selectColumns: string[]
  limit?: number
}

export interface VectorSearchResult {
  _distance: number
  [key: string]: unknown
}

/**
 * Perform vector similarity search on a Lance table.
 * @param params - Search parameters
 * @returns List of results with selected columns and similarity score
 */
export async function lanceVectorSearch(
  params: VectorSearchParams
): Promise<VectorSearchResult[]> {
  return postApi<VectorSearchResult[]>({
    url: `${API_PREFIX}/lance/vector-search`,
    data: params,
  })
}
