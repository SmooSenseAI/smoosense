'use client'

import { useEffect, useState } from 'react'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Database, Loader2, Table } from 'lucide-react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { formatRelativeTime, formatDate } from '@/lib/utils/timeUtils'

interface TableInfo {
  name: string
  cnt_rows: number | null
  cnt_columns: number | null
  cnt_versions: number | null
}

interface VersionInfo {
  version: number
  timestamp: number
  metadata: Record<string, unknown>
  total_rows: number | null
  rows_add: number | null
  rows_remove: number | null
  columns_add: string[]
  columns_remove: string[]
}

interface VersionDisplay {
  version: number
  date: string
  relative_time: string
  total_rows: number | null
  rows_add: number | null
  rows_remove: number | null
  columns_add: string[]
  columns_remove: string[]
  metadata: Record<string, unknown>
  [key: string]: unknown
}

function TablesList({
  tables,
  selectedTable,
  onTableClick
}: {
  tables: TableInfo[]
  selectedTable: string | null
  onTableClick: (tableName: string) => void
}) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => onTableClick(table.name)}
            className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors ${
              selectedTable === table.name ? 'border-primary bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{table.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {table.cnt_rows !== null && table.cnt_columns !== null && (
                <Badge variant="secondary" className="text-xs">
                  {table.cnt_rows.toLocaleString()} × {table.cnt_columns}
                </Badge>
              )}
              {table.cnt_versions !== null && (
                <Badge variant="outline" className="text-xs">
                  {table.cnt_versions} ver
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TablePreview({
  versions,
  loading,
  error
}: {
  versions: VersionInfo[] | null
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading versions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Versions</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!versions) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a table to view versions</p>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No versions found</p>
      </div>
    )
  }

  // Transform versions to display format
  // Note: Backend returns timestamps in seconds, but formatDate/formatRelativeTime expect milliseconds
  const versionsDisplay: VersionDisplay[] = versions.map(v => ({
    version: v.version,
    date: formatDate(v.timestamp * 1000),
    relative_time: formatRelativeTime(v.timestamp * 1000),
    total_rows: v.total_rows,
    rows_add: v.rows_add,
    rows_remove: v.rows_remove,
    columns_add: v.columns_add,
    columns_remove: v.columns_remove,
    metadata: v.metadata
  }))

  return (
    <div className="h-full">
      <BasicAGTable data={versionsDisplay} />
    </div>
  )
}

export default function DBContent({ rootFolder }: { rootFolder: string }) {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [versions, setVersions] = useState<VersionInfo[] | null>(null)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsError, setVersionsError] = useState<string | null>(null)

  useEffect(() => {
    if (!rootFolder) return

    const fetchTables = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/lance/list-tables?rootFolder=${encodeURIComponent(rootFolder)}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch tables')
        }
        const data = await response.json()
        setTables(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tables')
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [rootFolder])

  const handleTableClick = async (tableName: string) => {
    setSelectedTable(tableName)
    setVersionsLoading(true)
    setVersionsError(null)
    setVersions(null)

    try {
      const response = await fetch(
        `/api/lance/list-versions?rootFolder=${encodeURIComponent(rootFolder)}&tableName=${encodeURIComponent(tableName)}`
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data)
    } catch (err) {
      setVersionsError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setVersionsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-lg text-muted-foreground">Loading tables...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Tables</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Database className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Tables Found</h3>
          <p className="text-sm text-muted-foreground">
            The Lance database at <code className="bg-muted px-2 py-1 rounded">{rootFolder}</code> does not contain any tables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[30, 70]}
        minSize={20}
        maxSize={80}
        className="h-full"
      >
        <TablesList tables={tables} selectedTable={selectedTable} onTableClick={handleTableClick} />
        <TablePreview versions={versions} loading={versionsLoading} error={versionsError} />
      </ResizablePanels>
    </div>
  )
}
