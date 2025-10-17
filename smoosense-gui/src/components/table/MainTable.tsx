'use client'

import { useRef, useCallback, useImperativeHandle, forwardRef, useMemo, memo, useEffect } from 'react'
import { shallowEqual } from 'react-redux'
import { AgGridReact } from 'ag-grid-react'
import { GridReadyEvent, GridApi, ColumnResizedEvent, ColumnVisibleEvent, RowClickedEvent, SortChangedEvent } from 'ag-grid-community'
import { useAGGridTheme, useAg, useRenderType } from '@/lib/hooks'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useProcessedRowData } from '@/lib/hooks/useProcessedRowData'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { expandColDef, RenderType } from '@/lib/utils/agGridCellRenderers'
import { AlertCircle } from 'lucide-react'
import PaginationBar from '@/components/ui/PaginationBar'
import { updateColumnWidth, reorderColumns, updateColumnDef, setSorting } from '@/lib/features/colDefs/agSlice'
import { setJustClickedRowId } from '@/lib/features/viewing/viewingSlice'
import { handPickRow } from '@/lib/features/handPickedRows/handPickedRowsSlice'
import { InnerHeaderComponent } from './InnerHeaderComponent'
import { toast } from 'sonner'

ModuleRegistry.registerModules([AllCommunityModule])


export interface MainTableRef {
  scrollToColumn: (columnId: string) => void
}

const MainTable = memo(forwardRef<MainTableRef, object>((_props, ref) => {

  const dispatch = useAppDispatch()
  const theme = useAGGridTheme()

  // Combine UI selectors to reduce re-renders
  const { rowHeight, headerPlotHeight, filePath, sorting, samplingCondition } = useAppSelector((state) => ({
    rowHeight: state.ui.rowHeight,
    headerPlotHeight: state.ui.headerPlotHeight,
    filePath: state.ui.filePath,
    sorting: state.ag.sorting,
    samplingCondition: state.viewing.samplingCondition
  }), shallowEqual)

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: samplingCondition === null,
    filter: false,
    headerClass: 'ag-header-cell-text',
    floatingFilter: false,
    wrapText: true,
    headerComponentParams: {
      innerHeaderComponent: InnerHeaderComponent,
    },
  }), [samplingCondition])
  const gridApiRef = useRef<GridApi | null>(null)
  
  // Always call hooks - but handle null filePath gracefully in the hooks
  const { data, error: dataError } = useProcessedRowData()
  const { ag: baseColumnDefs } = useAg()
  const renderTypeColumns = useRenderType()


  // Memoize column definitions to prevent unnecessary recalculation
  const columnDefs = useMemo(() => {

    if (!baseColumnDefs) return []
    return baseColumnDefs.map(baseColDef => {
      const renderType = renderTypeColumns[baseColDef.field] || RenderType.Text
      
      // Find if this column has sorting applied
      const sortInfo = sorting.find(sort => sort.field === baseColDef.field)
      
      return {
        ...baseColDef, 
        ...expandColDef(renderType, baseColDef),
        width: baseColDef.width,
        // Apply sort to column if it exists in Redux state
        sort: sortInfo ? sortInfo.direction : null,
        sortIndex: sortInfo ? sorting.findIndex(s => s.field === baseColDef.field) : null
      }
    })
  }, [baseColumnDefs, renderTypeColumns, sorting])
  
  // Memoize pinned top row data to prevent recreation
  const pinnedTopRowData = useMemo(() => [{isTopRow: true}], [])
  
  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api
  }, [])
  
  const handleColumnResized = useCallback((event: ColumnResizedEvent) => {
    if (event.finished && event.columns) {
      // Update widths for all resized columns
      event.columns.forEach(column => {
        const colId = column.getColId()
        const width = column.getActualWidth()
        dispatch(updateColumnWidth({ field: colId, width }))
      })
    }
  }, [dispatch])
  
  const handleDragStopped = useCallback(() => {
    if (gridApiRef.current) {
      // Get current column order from grid
      const columnState = gridApiRef.current.getColumnState()
      const newOrder = columnState.map(state => state.colId)
      dispatch(reorderColumns(newOrder))
    }
  }, [dispatch])
  
  const handleColumnVisible = useCallback((event: ColumnVisibleEvent) => {
    if (event.columns) {
      // Update visibility state for all affected columns
      event.columns.forEach(column => {
        const colId = column.getColId()
        const isVisible = column.isVisible()
        dispatch(updateColumnDef({ 
          field: colId, 
          updates: { hide: !isVisible } 
        }))
      })
    }
  }, [dispatch])
  
  const scrollToColumn = useCallback((columnId: string) => {
    if (gridApiRef.current) {
      gridApiRef.current.ensureColumnVisible(columnId, 'start')
    }
  }, [])
  
  
  const handleRowClicked = useCallback((event: RowClickedEvent) => {
    // Skip setting justClickedRowId for pinned top row
    if (event.node.isRowPinned()) {
      return
    }

    // Get a unique identifier for the row - using row index as row id
    const rowId = event.rowIndex?.toString() || null
    dispatch(setJustClickedRowId(rowId))

    // Check if Ctrl key (or Cmd on Mac) is pressed
    const mouseEvent = event.event as MouseEvent | undefined
    if (mouseEvent && (mouseEvent.ctrlKey || mouseEvent.metaKey)) {
      const rowData = event.data
      if (rowData) {
        dispatch(handPickRow(rowData))
        toast.success(`Row ${rowId} has been hand-picked`)
      }
    }
  }, [dispatch])
  
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

    dispatch(setSorting(sortedColumns))
  }, [dispatch])

  // Refresh grid when row height changes
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.resetRowHeights()
    }
  }, [rowHeight, headerPlotHeight])

  // Apply sorting when Redux sorting state changes
  useEffect(() => {
    if (gridApiRef.current && sorting) {
      // Convert Redux sorting to AG-Grid column state format
      const columnState = sorting.map((sort, index) => ({
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
  }, [sorting])
  


  // Function to determine row height based on row type
  const getRowHeight = useCallback((params: { node: { isRowPinned(): boolean } }) => {
    if (params.node.isRowPinned()) {
      return headerPlotHeight
    }
    return rowHeight
  }, [headerPlotHeight, rowHeight])
  
  useImperativeHandle(ref, () => ({
    scrollToColumn
  }), [scrollToColumn])
  
  // Early return if no filePath - this should be handled at Table level
  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No File Selected</h3>
          <p className="text-muted-foreground">
            Please select a file to view its data
          </p>
        </div>
      </div>
    )
  }

  // Handle data loading error
  if (dataError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">{dataError}</p>

        </div>
      </div>
    )
  }


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 h-full w-full">
        <AgGridReact
          theme={theme}
          rowData={data}
          columnDefs={columnDefs}
          onGridReady={handleGridReady}
          onColumnResized={handleColumnResized}
          onDragStopped={handleDragStopped}
          onColumnVisible={handleColumnVisible}
          onRowClicked={handleRowClicked}
          onSortChanged={handleSortChanged}
          defaultColDef={defaultColDef}
          getRowHeight={getRowHeight}
          pinnedTopRowData={pinnedTopRowData}
          suppressRowVirtualisation={true}
          suppressColumnVirtualisation={true}
          animateRows={false}
          pagination={false}
        />
      </div>
      <PaginationBar />
    </div>
  )
}))

MainTable.displayName = 'MainTable'

export default MainTable