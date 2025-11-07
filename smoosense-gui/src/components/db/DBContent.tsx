'use client'

import { useEffect, useState } from 'react'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Database, Loader2, Table } from 'lucide-react'
import { pathJoin } from '@/lib/utils/pathUtils'
import TablePreview from './TablePreview'

export interface TableInfo {
  name: string
  cnt_rows: number | null
  cnt_columns: number | null
  cnt_versions: number | null
  cnt_indices: number | null
}

function TablesList({
  tables,
  selectedTable,
  onTableClick,
  onTableDoubleClick
}: {
  tables: TableInfo[]
  selectedTable: string | null
  onTableClick: (tableName: string) => void
  onTableDoubleClick: (tableName: string) => void
}) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => onTableClick(table.name)}
            onDoubleClick={() => onTableDoubleClick(table.name)}
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
                  v {table.cnt_versions}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DBContent({ dbPath }: { dbPath: string }) {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  useEffect(() => {
    if (!dbPath) return

    const fetchTables = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/lance/list-tables?dbPath=${encodeURIComponent(dbPath)}&dbType=lance`)
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
  }, [dbPath])

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const handleTableDoubleClick = (tableName: string) => {
    const tablePath = pathJoin(dbPath, `${tableName}.lance`)
    const url = `./Table?tablePath=${tablePath}`
    window.open(url, '_blank')
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
            The Lance database at <code className="bg-muted px-2 py-1 rounded">{dbPath}</code> does not contain any tables.
          </p>
        </div>
      </div>
    )
  }

  // Find the selected table's info
  const selectedTableInfo = selectedTable ? tables.find(t => t.name === selectedTable) : null

  return (
    <div className="h-full w-full">
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[30, 70]}
        minSize={20}
        maxSize={80}
        className="h-full"
      >
        <TablesList tables={tables} selectedTable={selectedTable} onTableClick={handleTableClick} onTableDoubleClick={handleTableDoubleClick} />
        <TablePreview dbPath={dbPath} tableName={selectedTable} tableInfo={selectedTableInfo} />
      </ResizablePanels>
    </div>
  )
}
