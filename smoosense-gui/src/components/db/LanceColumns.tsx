'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface ColumnInfo {
  name: string
  type: string
}

interface LanceColumnsProps {
  rootFolder: string
  tableName: string
}

export default function LanceColumns({ rootFolder, tableName }: LanceColumnsProps) {
  const [columns, setColumns] = useState<ColumnInfo[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchColumns = async () => {
      setLoading(true)
      setError(null)
      setColumns(null)

      try {
        const response = await fetch(
          `/api/lance/list-columns?rootFolder=${encodeURIComponent(rootFolder)}&tableName=${encodeURIComponent(tableName)}`
        )
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch columns')
        }
        const data = await response.json()
        setColumns(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load columns')
      } finally {
        setLoading(false)
      }
    }

    fetchColumns()
  }, [rootFolder, tableName])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading columns...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Columns</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No columns found</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => (
            <Tooltip key={column.name}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-default font-mono">
                  {column.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-mono">
                  {column.type}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
