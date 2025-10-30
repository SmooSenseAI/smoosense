'use client'

import { useState, useEffect } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { executeQueryAsListOfDict, generateSqlKey, type RowObject } from '@/lib/api/queries'
import { useAppDispatch } from '@/lib/hooks'
import BasicAGTable from '@/components/common/BasicAGTable'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'

interface RowTablePreviewerProps {
  item: TreeNode
}

export default function RowTablePreviewer({ item }: RowTablePreviewerProps) {
  const dispatch = useAppDispatch()
  const [data, setData] = useState<RowObject[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create SQL query to read first 10 rows
  const query = `SELECT * FROM '${item.path}' LIMIT 10`

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const sqlKey = generateSqlKey('table_preview')
        const result = await executeQueryAsListOfDict(query, sqlKey, dispatch, 'duckdb', item.path)
        setData(result)
      } catch (err) {
        console.error('Error executing table preview query:', err)
        setError(err instanceof Error ? err.message : 'Failed to load table data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dispatch])
  // Note: item.path is not included because it's already captured in the query dependency

  const renderContent = () => {
    if (isLoading) {
      return <PreviewLoading message="Loading table data..." />
    }

    if (error) {
      return (
        <PreviewError 
          title="Error loading table" 
          message={error} 
          details={`Query: ${query}`}
        />
      )
    }

    if (!data || data.length === 0) {
      return (
        <PreviewNotFound 
          title="No data found"
          message="The table appears to be empty or could not be read."
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