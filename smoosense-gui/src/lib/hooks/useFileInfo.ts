import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useState, useEffect } from 'react'
import { executeQueryAsListOfDict, generateSqlKey } from '@/lib/api/queries'

interface FileMetadata {
  [key: string]: string
}

interface FileInfo {
  path: string
}

interface FileInfoResponse {
  status: string
  metadata: FileMetadata
  file_info: FileInfo
}

interface UseFileInfoResult {
  data: FileInfoResponse | null
  loading: boolean
  error: string | null
}

export function useFileInfo(): UseFileInfoResult {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const dispatch = useAppDispatch()
  const [data, setData] = useState<FileInfoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tablePath) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchFileInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialize metadata
        const metadata: FileMetadata = {}

        // For parquet files, get key-value metadata using SQL query
        if (tablePath.toLowerCase().endsWith('.parquet')) {
          try {
            const metadataQuery = `SELECT CAST(key AS VARCHAR) AS key, CAST(value AS VARCHAR) AS value FROM parquet_kv_metadata('${tablePath}')`
            const sqlKey = generateSqlKey('parquet_kv_metadata')
            const metadataResult = await executeQueryAsListOfDict(metadataQuery, sqlKey, dispatch, queryEngine, tablePath)

            // Convert the result to metadata object
            for (const row of metadataResult) {
              const key = String(row.key)
              const value = String(row.value)

              // Filter out pandas metadata
              if (!['ARROW:schema', 'pandas'].includes(key)) {
                metadata[key] = value
              }
            }
          } catch (metadataError) {
            console.warn('Failed to get parquet metadata:', metadataError)
            // Continue with empty metadata
          }
        }

        // Create file info with just the path (since we don't have size/modified from SQL)
        const fileInfo: FileInfo = {
          path: tablePath
        }

        const responseData: FileInfoResponse = {
          status: 'success',
          metadata,
          file_info: fileInfo
        }

        setData(responseData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFileInfo()
  }, [tablePath, queryEngine, dispatch])

  return { data, loading, error }
}