'use client'

import React, { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, CellClickedEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useAGGridTheme, useAGGridDefaultColDef } from '@/lib/hooks'
import { useHeatMap } from '@/lib/hooks/useHeatMap'
import { Y_LABEL_VALUE } from '@/lib/features/heatmap/heatmapSlice'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import { setNeedRefresh } from '@/lib/features/rowData/rowDataSlice'
import { sanitizeName, sanitizeValue } from '@/lib/utils/sql/helpers'
import { Button } from '@/components/ui/button'

ModuleRegistry.registerModules([AllCommunityModule])

// Row header component with sorting capability
const HeatmapRowHeader = React.memo<{ value: string }>(({ value }) => {
  // For now, just display the value - sorting can be added later
  return (
    <Button
      variant="ghost"
      className="w-full h-full justify-start text-left p-2 font-normal"
    >
      <span className="truncate flex-1">{value}</span>
    </Button>
  )
})

HeatmapRowHeader.displayName = 'HeatmapRowHeader'

// Cell renderer for heatmap values with color coding
const HeatmapCellRenderer = React.memo<{ 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any, 
  maxValue: number
}>(({ value, maxValue }) => {
  if (!value || typeof value.cnt !== 'number') {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">-</div>
  }

  const count = value.cnt
  const intensity = maxValue > 0 ? count / maxValue : 0
  const opacity = Math.max(0.1, Math.min(1, intensity))
  
  // Use different opacity for background color
  const bgOpacity = Math.max(0.05, Math.min(0.3, intensity))

  return (
    <div 
      className="w-full h-full flex items-center justify-center relative cursor-pointer hover:bg-accent transition-colors"
      style={{
        backgroundColor: `rgba(59, 130, 246, ${bgOpacity})` // blue with variable opacity
      }}
    >
      <span 
        className="font-medium text-sm"
        style={{ opacity }}
      >
        {count.toLocaleString()}
      </span>
    </div>
  )
})

HeatmapCellRenderer.displayName = 'HeatmapCellRenderer'

export default function HeatMapTable() {
  const dispatch = useAppDispatch()
  const { data, loading, error } = useHeatMap()
  const heatmapXColumn = useAppSelector((state) => state.ui.heatmapXColumn)
  const heatmapYColumn = useAppSelector((state) => state.ui.heatmapYColumn)
  
  const gridRef = useRef<AgGridReact>(null)
  const theme = useAGGridTheme()
  const defaultColDef = useAGGridDefaultColDef()

  // Prepare row data
  const rowData = useMemo(() => data?.rowData || [], [data])


  // Calculate max value for color scaling
  const maxValue = useMemo(() => {
    if (!data) return 0
    return data.allStats?.max || 0
  }, [data])

  // Generate column definitions
  const colDefs = useMemo((): ColDef[] => {
    if (!data || !data.xLabels) return []

    const columns: ColDef[] = [
      // Y-axis labels column
      {
        field: Y_LABEL_VALUE,
        headerName: heatmapYColumn || 'Y Column',
        pinned: 'left',
        width: 150,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellRenderer: (params: any) => <HeatmapRowHeader value={params.value} />,
        sortable: false,
        resizable: false,
      },
      // Row totals column  
      {
        field: 'rowTotal',
        headerName: 'Row Total',
        pinned: 'left',
        width: 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellRenderer: (params: any) => {
          const count = params.value
          return (
            <div className="w-full h-full flex items-center justify-center font-medium">
              {count.toLocaleString()}
            </div>
          )
        },
        sortable: true,
        sort: 'desc', // Default sort by row total descending
      }
    ]

    // Add columns for each X-axis value
    data.xLabels.forEach((xLabel) => {
      columns.push({
        field: xLabel,
        headerName: xLabel,
        width: 80,
        minWidth: 60,
        maxWidth: 120,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellRenderer: (params: any) => (
          <HeatmapCellRenderer 
            value={params.value} 
            maxValue={maxValue}
          />
        ),
        sortable: true,
        comparator: (a, b) => {
          const aCount = a?.cnt || 0
          const bCount = b?.cnt || 0
          return aCount - bCount
        }
      })
    })

    return columns
  }, [data, heatmapYColumn, maxValue])

  // Handle cell clicks for filtering
  const onCellClicked = useCallback((params: CellClickedEvent) => {
    if (!heatmapXColumn || !heatmapYColumn) return

    const colId = params.column.getColId()
    
    // Skip clicks on row headers and totals
    if (colId === Y_LABEL_VALUE || colId === 'rowTotal') return

    const x = colId
    const y = params.data[Y_LABEL_VALUE]
    
    if (x && y) {
      const sampleCondition = `${sanitizeName(heatmapXColumn)} = ${sanitizeValue(x)} AND ${sanitizeName(heatmapYColumn)} = ${sanitizeValue(y)}`
      dispatch(setSamplingCondition(sampleCondition))
      dispatch(setNeedRefresh(true))
    }
  }, [dispatch, heatmapXColumn, heatmapYColumn])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onGridSizeChanged = useCallback((params: any) => {
    params.api.sizeColumnsToFit()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading heatmap...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive">Error loading heatmap</div>
          <div className="text-xs text-muted-foreground mt-2">{error}</div>
        </div>
      </div>
    )
  }

  if (!data || !data.rowData.length) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">No heatmap data available</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <AgGridReact
        ref={gridRef}
        theme={theme}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        domLayout="normal"
        headerHeight={50}
        rowHeight={40}
        onCellClicked={onCellClicked}
        onGridReady={onGridReady}
        onGridSizeChanged={onGridSizeChanged}
        suppressCellFocus
        enableCellTextSelection={false}
      />
    </div>
  )
}