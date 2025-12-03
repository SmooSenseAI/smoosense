import { sanitizeName } from './helpers'

export interface SimilarEmbeddingsParams {
  columnName: string
  embedding: number[]
  queryEngine: string
  tablePath: string
  filterCondition?: string | null
  limit?: number
}

/**
 * Build a SQL query to find rows with similar embeddings using cosine similarity.
 */
export function buildSimilarEmbeddingsQuery({
  columnName,
  embedding,
  queryEngine,
  tablePath,
  filterCondition,
  limit = 12,
}: SimilarEmbeddingsParams): string {
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`
  const sanitizedCol = sanitizeName(columnName)
  const embeddingStr = `[${embedding.join(', ')}]`

  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''

  return `
    SELECT *, LIST_COSINE_SIMILARITY(${sanitizedCol}, ${embeddingStr}) AS similarity
    FROM ${tableRef}
    ${whereClause}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `
}
