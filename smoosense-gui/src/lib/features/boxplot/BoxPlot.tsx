'use client'

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, SortChangedEvent, GridApi } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import BoxPlotControls from '@/lib/features/boxplot/BoxPlotControls'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'
import { useBoxPlot } from '@/lib/hooks/useBoxPlot'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useAGGridTheme, useAGGridDefaultColDef } from '@/lib/hooks'
import BoxPlotCellRenderer from '@/lib/utils/cellRenderers/BoxPlotCellRenderer'
import { setBoxPlotSorting } from '@/lib/features/ui/uiSlice'

ModuleRegistry.registerModules([AllCommunityModule])

export default function BoxPlot() {
  const dispatch = useAppDispatch()
  const { data, loading, error } = useBoxPlot()
  const boxPlotColumns = useAppSelector((state) => state.ui.boxPlotColumns)
  const boxPlotSortBy = useAppSelector((state) => state.ui.boxPlotSortBy)
  const boxPlotBreakdownColumn = useAppSelector((state) => state.ui.boxPlotBreakdownColumn)
  const boxPlotSorting = useAppSelector((state) => state.ui.boxPlotSorting)
  
  const gridRef = useRef<AgGridReact>(null)
  const gridApiRef = useRef<GridApi | null>(null)
  const theme = useAGGridTheme()
  const defaultColDef = useAGGridDefaultColDef()

  // Use raw data directly as row data
  const rowData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Data is already in the correct format from the SQL query
    return data
  }, [data])

  // Generate column definitions based on the raw data structure
  const colDefs = useMemo((): ColDef[] => {
    const columns: ColDef[] = []
    
    // Breakdown column
    const breakdownSortInfo = boxPlotSorting.find(sort => sort.field === 'breakdown')
    columns.push({
      field: 'breakdown',
      headerName: boxPlotBreakdownColumn || 'Breakdown',
      pinned: 'left',
      width: 150,
      sortable: true,
      sort: breakdownSortInfo ? breakdownSortInfo.direction : null,
      sortIndex: breakdownSortInfo ? boxPlotSorting.findIndex(s => s.field === 'breakdown') : null
    })
    
    // Count column
    const countSortInfo = boxPlotSorting.find(sort => sort.field === 'count')
    columns.push({
      field: 'count',
      headerName: 'Count',
      pinned: 'left',
      width: 100,
      sortable: true,
      sort: countSortInfo ? countSortInfo.direction : null,
      sortIndex: countSortInfo ? boxPlotSorting.findIndex(s => s.field === 'count') : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cellRenderer: (params: any) => (
        <div className="w-full h-full flex items-center justify-center">
          {params.value?.toLocaleString()}
        </div>
      ),
    })

    // Add a column for each selected boxplot column
    boxPlotColumns.forEach(columnName => {
      const sortInfo = boxPlotSorting.find(sort => sort.field === columnName)
      columns.push({
        field: columnName,
        headerName: columnName,
        flex: 1,
        minWidth: 200,
        cellStyle: {
          padding: '1px'
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellRenderer: (params: any) => (
          <BoxPlotCellRenderer 
            value={params.value}
            columnName={columnName}
            breakdownName={boxPlotBreakdownColumn || undefined}
            breakdownValue={params.data?.breakdown}
          />
        ),
        sortable: true,
        sort: sortInfo ? sortInfo.direction : null,
        sortIndex: sortInfo ? boxPlotSorting.findIndex(s => s.field === columnName) : null,
        // Sort by the selected sort criteria
        comparator: (a, b) => {
          if (!a || !b) return 0
          const aVal = a[boxPlotSortBy] || 0
          const bVal = b[boxPlotSortBy] || 0
          return  aVal - bVal // Sort descending
        }
      })
    })

    return columns
  }, [boxPlotBreakdownColumn, boxPlotColumns, boxPlotSortBy, boxPlotSorting])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api
    params.api.sizeColumnsToFit()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onGridSizeChanged = useCallback((params: any) => {
    params.api.sizeColumnsToFit()
  }, [])

  const handleSortChanged = useCallback((event: SortChangedEvent) => {
    const columns = event.api.getColumns()
    if (!columns) return

    const sortedColumns = columns
      .filter(col => col.getSortIndex() !== null && col.getSortIndex() !== undefined)
      .map(col => ({
        field: col.getColDef().field!,
        direction: col.getSort() as 'asc' | 'desc',
        sortIndex: col.getSortIndex()!
      }))
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map(({ field, direction }) => ({ field, direction }))

    dispatch(setBoxPlotSorting(sortedColumns))
  }, [dispatch])

  // Apply sorting when Redux sorting state changes
  useEffect(() => {
    if (gridApiRef.current && boxPlotSorting) {
      // Convert Redux sorting to AG-Grid column state format
      const columnState = boxPlotSorting.map((sort, index) => ({
        colId: sort.field,
        sort: sort.direction,
        sortIndex: index
      }))
      
      // Apply the sort state to the grid
      gridApiRef.current.applyColumnState({
        state: columnState,
        defaultState: { sort: null }
      })
    }
  }, [boxPlotSorting])

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <BoxPlotControls />
      
      {/* AG Grid */}
      <div className="flex-1">
        {loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse text-muted-foreground">Loading box plot...</div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-destructive">Error loading box plot</div>
              <div className="text-xs text-muted-foreground mt-2">{error}</div>
            </div>
          </div>
        ) : boxPlotColumns.length === 0 ? (
          <TextPlaceHolder>Please select at least one value column to display the box plot</TextPlaceHolder>
        ) : data.length === 0 ? (
          <TextPlaceHolder>No data available for the selected columns</TextPlaceHolder>
        ) : (
          <div className="w-full h-full">
            <AgGridReact
              ref={gridRef}
              theme={theme}
              rowData={rowData}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              domLayout="normal"
              rowHeight={36}
              onGridReady={onGridReady}
              onGridSizeChanged={onGridSizeChanged}
              onSortChanged={handleSortChanged}
              suppressCellFocus
              enableCellTextSelection={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}