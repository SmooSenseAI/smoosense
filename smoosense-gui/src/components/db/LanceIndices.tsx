'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { useAGGridTheme, useAGGridDefaultColDef, useAGGridOptions, useAppSelector } from '@/lib/hooks'
import { getApi } from '@/lib/utils/apiUtils'

ModuleRegistry.registerModules([AllCommunityModule])

export interface IndexInfo {
  name: string
  index_type: string
  columns: string[]
  num_unindexed_rows: number | null
}

interface LanceIndicesProps {
  rootFolder: string
  tableName: string
}

export default function LanceIndices({ rootFolder, tableName }: LanceIndicesProps) {
  const [indices, setIndices] = useState<IndexInfo[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hooks must be called unconditionally at the top
  const theme = useAGGridTheme()
  const defaultColDef = useAGGridDefaultColDef()
  const baseGridOptions = useAGGridOptions()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  useEffect(() => {
    getApi({
      relativeUrl: `lance/list-indices?rootFolder=${encodeURIComponent(rootFolder)}&tableName=${encodeURIComponent(tableName)}`,
      setData: (data) => setIndices(data as IndexInfo[]),
      setLoading,
      setError,
    })
  }, [rootFolder, tableName])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading indices...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Indices</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!indices || indices.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No indices found</p>
      </div>
    )
  }

  // Custom cell renderer for columns
  const columnsRenderer = (params: { value: string[] }) => {
    if (!params.value || params.value.length === 0) return null
    return <div>{params.value.join(', ')}</div>
  }

  const columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200
    },
    {
      field: 'index_type',
      headerName: 'Type',
      width: 150
    },
    {
      field: 'columns',
      headerName: 'Columns',
      cellRenderer: columnsRenderer,
      flex: 1
    },
    {
      field: 'num_unindexed_rows',
      headerName: 'Unindexed Rows',
      width: 150,
      valueFormatter: (params) => params.value !== null && params.value !== undefined ? params.value.toLocaleString() : ''
    }
  ]

  const gridOptions: GridOptions = {
    ...baseGridOptions,
    rowHeight
  }

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }

  return (
    <div className="h-full w-full">
      <AgGridReact
        theme={theme}
        rowData={indices}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        {...gridOptions}
      />
    </div>
  )
}
