'use client'

import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import { useColumnMeta, useAGGridTheme, useAppSelector } from '@/lib/hooks'
import { useCardinalityBulk } from '@/lib/hooks/useCardinality'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import PercentageRenderer from '@/lib/utils/cellRenderers/PercentageRenderer'
import DefaultCellRenderer from '@/lib/utils/cellRenderers/DefaultCellRenderer'
import { RenderType } from '@/lib/utils/agGridCellRenderers'

// Cell renderer component for distribution column
function DistributionCellRenderer({ data }: { data: { columnName: string } }) {
  return (
    <div className="h-full w-full">
      <HeaderStatsCellRendererImpl columnName={data.columnName} />
    </div>
  )
}

// Cell renderer component for approximate count distinct
function ApproxCountDistinctCellRenderer({ value }: { value: number | null }) {
  return <DefaultCellRenderer value={value} type={RenderType.Number} />
}

export default function Summary() {
  const { columns, loading, error } = useColumnMeta()
  const theme = useAGGridTheme()
  const headerPlotHeight = useAppSelector((state) => state.ui.headerPlotHeight)
  const filteredStats = useAppSelector((state) => state.columns.filteredStats)
  const { cardinalityColumns } = useCardinalityBulk()

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'columnName',
      headerName: 'Column Name',
      width: 200,
      cellClass: 'font-medium',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: DefaultCellRenderer,
    },
    {
      field: 'duckdbType',
      headerName: 'Type',
      width: 150,
      cellClass: 'text-muted-foreground',
      filter: 'agTextColumnFilter',
      floatingFilter: true
    },
    {
      field: 'distribution',
      headerName: 'Distribution',
      width: 250,
      cellRenderer: DistributionCellRenderer,
      sortable: false,
      filter: false,
      cellStyle: {
        padding: '1px'
      }
    },
    {
      field: 'nonNullPercentage',
      headerName: 'Non-Null %',
      width: 200,
      cellRenderer: PercentageRenderer,
      filter: false,
      floatingFilter: false
    },
    {
      field: 'approxCountDistinct',
      headerName: 'Approx Count Distinct',
      width: 180,
      cellRenderer: ApproxCountDistinctCellRenderer,
      filter: false,
      floatingFilter: false
    },
    {
      field: 'min',
      headerName: 'Min',
      minWidth: 150,
      flex: 1,
      cellRenderer: DefaultCellRenderer,
      filter: false,
      floatingFilter: false
    },
    {
      field: 'max',
      headerName: 'Max',
      minWidth: 150,
      flex: 1,
      cellRenderer: DefaultCellRenderer,
      filter: false,
      floatingFilter: false
    },
  ], [])

  const rowData = useMemo(() => {
    if (!columns) return []
    return columns.map(column => {
      const columnStats = filteredStats[column.column_name]?.data
      const nonNullPercentage = columnStats?.cnt_not_null && columnStats?.cnt_all 
        ? (columnStats.cnt_not_null / columnStats.cnt_all) * 100
        : null
      
      const cardinalityData = cardinalityColumns[column.column_name]?.data
      const approxCountDistinct = cardinalityData?.approxCntD ?? null
      
      const min = columnStats?.range?.min ?? null
      const max = columnStats?.range?.max ?? null
      
      return {
        columnName: column.column_name,
        duckdbType: column.duckdbType,
        nonNullPercentage,
        approxCountDistinct,
        min,
        max,
        distribution: null // This will be handled by the cell renderer
      }
    })
  }, [columns, filteredStats, cardinalityColumns])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse text-sm">Loading columns...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <div className="text-sm">Error loading columns</div>
          <div className="text-xs mt-1">{error}</div>
        </div>
      </div>
    )
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-sm">No columns available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <AgGridReact
        theme={theme}
        columnDefs={columnDefs}
        rowData={rowData}
        rowHeight={headerPlotHeight}
        headerHeight={40}
        domLayout="normal"
      />
    </div>
  )
}