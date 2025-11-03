'use client'

import { useState, useEffect } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { executeQueryAsListOfDict, generateSqlKey, type RowObject } from '@/lib/api/queries'
import { useAppDispatch } from '@/lib/hooks'
import BasicAGTable from '@/components/common/BasicAGTable'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'
import PreviewNotImplemented from './shared/PreviewNotImplemented'

interface ColumnarTablePreviewerProps {
  item: TreeNode
}

export default function ColumnarTablePreviewer({ item }: ColumnarTablePreviewerProps) {
  const dispatch = useAppDispatch()
  const [data, setData] = useState<RowObject[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if this is a Parquet file
  const isParquet = item.name.toLowerCase().endsWith('.parquet')
  
  // Create SQL query for Parquet metadata
  const query = isParquet ? `WITH meta AS (
    SELECT
        path_in_schema AS column_name,
        SUM(num_values) AS cntAll,
        SUM(stats_null_count) AS cntNull,
        MIN(stats_min_value) AS min,
        MAX(stats_max_value) AS max
    FROM parquet_metadata('${item.path}')
    GROUP BY path_in_schema
  )
  SELECT column_name, column_type, cntAll, cntNull, min, max
  FROM (DESCRIBE SELECT * FROM read_parquet ('${item.path}'))
      LEFT JOIN meta USING (column_name)` : null

  useEffect(() => {
    if (!isParquet || !query) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const sqlKey = generateSqlKey('parquet_metadata')
        const result = await executeQueryAsListOfDict(query, sqlKey, dispatch, 'duckdb', item.path)
        setData(result)
      } catch (err) {
        console.error('Error executing parquet metadata query:', err)
        setError(err instanceof Error ? err.message : 'Failed to load parquet metadata')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dispatch, isParquet])
  // Note: item.path is not included because it's already captured in the query dependency

  const renderContent = () => {
    if (!isParquet) {
      return (
        <PreviewNotImplemented 
          message="Preview for this columnar file format is not implemented yet."
          details={`File: ${item.name}. Currently only Parquet files are supported for columnar table preview.`}
        />
      )
    }

    if (isLoading) {
      return <PreviewLoading message="Loading Parquet metadata..." />
    }

    if (error) {
      return <PreviewError title="Error loading metadata" message={error} />
    }

    if (!data || data.length === 0) {
      return (
        <PreviewNotFound 
          title="No metadata found"
          message="No column metadata could be retrieved from the Parquet file."
        />
      )
    }

    return (
      <div className="flex-1 border rounded-lg overflow-hidden">
        <BasicAGTable data={data as Record<string, unknown>[]} />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {renderContent()}
    </div>
  )
}