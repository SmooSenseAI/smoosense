'use client'

import { AgGridReact } from 'ag-grid-react'
import { GridReadyEvent, ColDef, GridOptions } from 'ag-grid-community'
import { useAGGridTheme, useAGGridDefaultColDef, useAGGridOptions, useAppSelector } from '@/lib/hooks'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { inferColumnDefinitions } from '@/lib/utils/agGridCellRenderers'

ModuleRegistry.registerModules([AllCommunityModule])

interface BasicAGTableProps {
  data: Record<string, unknown>[]
  className?: string
  onGridReady?: (params: GridReadyEvent) => void
  colDefOverrides?: Record<string, Partial<ColDef>>
  gridOptionOverrides?: Partial<GridOptions>
}


export default function BasicAGTable({ data, className = '', onGridReady, colDefOverrides, gridOptionOverrides }: BasicAGTableProps) {
  const theme = useAGGridTheme()
  const defaultColDef = useAGGridDefaultColDef()
  const baseGridOptions = useAGGridOptions()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  // Generate base column definitions
  const baseColumnDefs = inferColumnDefinitions(data)

  // Apply overrides if provided
  const columnDefs = colDefOverrides
    ? baseColumnDefs.map(colDef => {
        const fieldName = colDef.field
        const overrides = fieldName ? colDefOverrides[fieldName] : undefined
        return overrides ? { ...colDef, ...overrides } : colDef
      })
    : baseColumnDefs

  // Construct final grid options
  const finalGridOptions: GridOptions = {
    ...baseGridOptions,
    rowHeight,
    ...gridOptionOverrides
  }
  
  const handleGridReady = (params: GridReadyEvent) => {
    //params.api.sizeColumnsToFit()
    onGridReady?.(params)
  }
  
  return (
    <div className={`h-full w-full ${className}`}>
      <AgGridReact
        theme={theme}
        rowData={data}
        columnDefs={columnDefs}
        onGridReady={handleGridReady}
        defaultColDef={defaultColDef}
        {...finalGridOptions}
      />
    </div>
  )
}