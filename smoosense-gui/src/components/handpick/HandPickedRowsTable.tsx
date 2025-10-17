'use client'

import { useMemo, memo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { useAppSelector, useAGGridTheme, useAg, useRenderType } from '@/lib/hooks'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { expandColDef, RenderType } from '@/lib/utils/agGridCellRenderers'

ModuleRegistry.registerModules([AllCommunityModule])

const HandPickedRowsTable = memo(function HandPickedRowsTable() {
  const handPickedRows = useAppSelector((state) => state.handPickedRows.rows)
  const theme = useAGGridTheme()
  const { ag: baseColumnDefs } = useAg()
  const renderTypeColumns = useRenderType()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  // Memoize column definitions
  const columnDefs = useMemo(() => {
    if (!baseColumnDefs) return []
    return baseColumnDefs.map(baseColDef => {
      const renderType = renderTypeColumns[baseColDef.field] || RenderType.Text
      return {
        ...baseColDef,
        ...expandColDef(renderType, baseColDef),
        width: baseColDef.width,
      }
    })
  }, [baseColumnDefs, renderTypeColumns])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: false,
  }), [])

  if (handPickedRows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No Hand-Picked Rows</h3>
          <p className="text-muted-foreground">
            Command+Click a row to hand-pick it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <AgGridReact
        theme={theme}
        rowData={handPickedRows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={rowHeight}
        animateRows={false}
        pagination={false}
      />
    </div>
  )
})

export default HandPickedRowsTable
