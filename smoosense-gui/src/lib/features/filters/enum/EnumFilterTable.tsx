'use client'

import React, { useMemo, useEffect, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { GridReadyEvent, ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { useAGGridTheme, useAGGridDefaultColDef, useAGGridOptions } from '@/lib/hooks'
import PercentageRenderer from '@/lib/utils/cellRenderers/PercentageRenderer'

ModuleRegistry.registerModules([AllCommunityModule])

interface CntValue {
  value: string | number | boolean
  cnt: number
  [key: string]: string | number | boolean | undefined
}

interface EnumFilterTableProps {
  data: CntValue[]
  cntAll: number
  /** Current array of selected enum values */
  selectedValues: string[]
  /** Callback fired when user changes row selection via checkboxes, with array of selected values */
  onSelectionChange: (selectedValues: string[]) => void
}

function EnumFilterTable({
  data,
  cntAll,
  selectedValues,
  onSelectionChange
}: EnumFilterTableProps) {
  const gridApiRef = useRef<GridReadyEvent | null>(null)
  
  // Memoize theme options to prevent object recreation
  const themeOptions = useMemo(() => ({ withPadding: true }), [])
  const theme = useAGGridTheme(themeOptions)
  const defaultColDef = useAGGridDefaultColDef()
  const gridOptions = useAGGridOptions()

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'value',
      headerName: 'Value',
      flex: 2
    },
    {
      field: 'cnt',
      headerName: 'Count',
      flex: 1
    },
    {
      field: 'percent',
      headerName: 'Percent',
      flex: 2,
      cellRenderer: PercentageRenderer
    }
  ], [])

  const tableData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((item, index) => ({
      id: index,
      value: String(item.value),
      cnt: item.cnt,
      percent: (item.cnt / cntAll) * 100
    }))
  }, [data, cntAll])

  const handleSelectionChanged = useCallback(() => {
    if (gridApiRef.current?.api) {
      const selectedRows = gridApiRef.current.api.getSelectedRows()
      const selectedRowValues = selectedRows.map(row => String(row.value))
      onSelectionChange(selectedRowValues)
    }
  }, [onSelectionChange])

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params
    // Select rows that match selectedValues
    if (tableData.length > 0) {
      tableData.forEach((row, index) => {
        if (selectedValues.includes(row.value)) {
          const rowNode = params.api.getRowNode(String(index))
          if (rowNode) {
            rowNode.setSelected(true)
          }
        }
      })
    }
  }, [selectedValues, tableData])

  // Update grid selection when selectedValues changes
  useEffect(() => {
    if (gridApiRef.current?.api && tableData.length > 0) {
      gridApiRef.current.api.deselectAll()
      let singleSelectedIndex = -1
      
      tableData.forEach((row, index) => {
        if (selectedValues.includes(row.value)) {
          const rowNode = gridApiRef.current?.api.getRowNode(String(index))
          if (rowNode) {
            rowNode.setSelected(true)
          }
          // Track index if this is the only selected value
          if (selectedValues.length === 1) {
            singleSelectedIndex = index
          }
        }
      })
      
      // Refresh row styles after selection changes
      gridApiRef.current.api.redrawRows()
      
      // Auto-scroll to row if exactly one value is selected
      if (singleSelectedIndex !== -1) {
        gridApiRef.current.api.ensureIndexVisible(singleSelectedIndex, 'middle')
      }
    }
  }, [selectedValues, tableData])

  return (
    <div className="border rounded" style={{ height: '200px' }}>
      <AgGridReact
        theme={theme}
        rowData={tableData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true
        }}
        onGridReady={handleGridReady}
        onSelectionChanged={handleSelectionChanged}
        {...gridOptions}
      />
    </div>
  )
}

export default React.memo(EnumFilterTable, (prevProps, nextProps) => {
  // Only re-render if essential props have changed
  return (
    JSON.stringify(prevProps.selectedValues) === JSON.stringify(nextProps.selectedValues)
  )
})