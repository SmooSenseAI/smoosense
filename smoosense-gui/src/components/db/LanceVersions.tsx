'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridOptions } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { useAGGridTheme, useAGGridDefaultColDef, useAGGridOptions, useAppSelector } from '@/lib/hooks'
import { formatRelativeTime, formatDate } from '@/lib/utils/timeUtils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

ModuleRegistry.registerModules([AllCommunityModule])

export interface VersionInfo {
  version: number
  timestamp: number
  metadata: Record<string, unknown>
  total_rows: number | null
  rows_add: number | null
  rows_remove: number | null
  columns_add: string[]
  columns_remove: string[]
}

interface LanceVersionsProps {
  rootFolder: string
  tableName: string
}

export default function LanceVersions({ rootFolder, tableName }: LanceVersionsProps) {
  const [versions, setVersions] = useState<VersionInfo[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hooks must be called unconditionally at the top
  const theme = useAGGridTheme()
  const defaultColDef = useAGGridDefaultColDef()
  const baseGridOptions = useAGGridOptions()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true)
      setError(null)
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
        setError(err instanceof Error ? err.message : 'Failed to load versions')
      } finally {
        setLoading(false)
      }
    }

    fetchVersions()
  }, [rootFolder, tableName])

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

  if (!versions || versions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No versions found</p>
      </div>
    )
  }

  // Custom cell renderers
  const createdAtRenderer = (params: { value: number }) => {
    if (!params.value) return null
    const timestampMs = params.value * 1000
    const relativeTime = formatRelativeTime(timestampMs)
    const fullDate = formatDate(timestampMs)

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">
            {relativeTime} ago
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {fullDate}
        </TooltipContent>
      </Tooltip>
    )
  }

  const rowsDiffRenderer = (params: { data: VersionInfo }) => {
    const { rows_add, rows_remove } = params.data

    return (
      <div className="flex flex-col text-sm leading-tight py-2 gap-1 font-mono">
        {rows_add !== null && rows_add > 0 && (
          <div className="text-green-600 dark:text-green-400">+ {rows_add.toLocaleString()}</div>
        )}
        {rows_remove !== null && rows_remove > 0 && (
          <div className="text-red-600 dark:text-red-400">- {rows_remove.toLocaleString()}</div>
        )}
      </div>
    )
  }

  const columnsDiffRenderer = (params: { data: VersionInfo }) => {
    const { columns_add, columns_remove } = params.data

    return (
      <div className="flex flex-col text-sm leading-tight py-2 gap-1">
        {columns_add.length > 0 && (
          <div className="text-green-600 dark:text-green-400">+ {columns_add.join(', ')}</div>
        )}
        {columns_remove.length > 0 && (
          <div className="text-red-600 dark:text-red-400">- {columns_remove.join(', ')}</div>
        )}
      </div>
    )
  }

  const columnDefs: ColDef[] = [
    {
      field: 'version',
      headerName: 'Version',
      width: 100
    },
    {
      field: 'timestamp',
      headerName: 'Created At',
      cellRenderer: createdAtRenderer,
      width: 150
    },
    {
      field: 'total_rows',
      headerName: 'Total Rows',
      width: 120,
      valueFormatter: (params) => params.value !== null ? params.value.toLocaleString() : ''
    },
    {
      headerName: 'Rows Diff',
      cellRenderer: rowsDiffRenderer,
      width: 120,
      autoHeight: true
    },
    {
      headerName: 'Columns Diff',
      cellRenderer: columnsDiffRenderer,
      width: 200,
      autoHeight: true
    },
    {
      field: 'metadata',
      headerName: 'Metadata',
      flex: 1,
      valueFormatter: (params) => JSON.stringify(params.value)
    }
  ]

  const gridOptions: GridOptions = {
    ...baseGridOptions,
    rowHeight
  }

  return (
    <TooltipProvider>
      <div className="h-full w-full">
        <AgGridReact
          theme={theme}
          rowData={versions}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          {...gridOptions}
        />
      </div>
    </TooltipProvider>
  )
}
