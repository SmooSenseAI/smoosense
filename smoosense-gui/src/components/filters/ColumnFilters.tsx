'use client'

import { useColumnMeta, useRenderType, useAg } from '@/lib/hooks'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { useMemo } from 'react'

export default function ColumnFilters() {
  const { columns, loading, error } = useColumnMeta()
  const renderTypeColumns = useRenderType()
  const { ag: columnDefs, loading: agLoading, error: agError } = useAg()
  
  // Filter columns to only show Text, Number, Boolean render types in ag.columnDefs order, skip hidden
  const filterableColumns = useMemo(() => {
    if (!columns || !renderTypeColumns || !columnDefs) return []
    
    const allowedRenderTypes = [RenderType.Text, RenderType.Number, RenderType.Boolean]
    
    // Use columnDefs order and filter out hidden columns
    return columnDefs
      .filter(colDef => !colDef.hide) // Skip hidden columns
      .map(colDef => {
        // Find the corresponding column metadata
        return columns.find(column => column.column_name === colDef.field)
      })
      .filter((column): column is NonNullable<typeof column> => {
        // Only include columns that exist and have allowed render types
        if (!column) return false
        const renderType = renderTypeColumns[column.column_name]
        return allowedRenderTypes.includes(renderType)
      })
  }, [columns, renderTypeColumns, columnDefs])

  const isLoading = loading || agLoading
  const hasError = error || agError

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse text-sm">Loading columns...</div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <div className="text-sm">Error loading columns</div>
          <div className="text-xs mt-1">{hasError}</div>
        </div>
      </div>
    )
  }

  if (!filterableColumns || filterableColumns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-sm">No Text, Number, or Boolean columns available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        <div className="space-y-2">
          {filterableColumns.map((column) => (
              <div key={column.column_name} className="border rounded overflow-hidden">
                {/* Stats cell renderer with column name */}
                <div className="h-21 w-full">
                  <HeaderStatsCellRendererImpl 
                    columnName={column.column_name} 
                    side="right" 
                    showColumnName={true}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}