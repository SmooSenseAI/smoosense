'use client'

import { useMemo, memo, useState, useEffect, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { useAppSelector, useAppDispatch, useAGGridTheme, useAg, useRenderType } from '@/lib/hooks'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { expandColDef, RenderType } from '@/lib/utils/agGridCellRenderers'
import { clearHandPickedRows, PrimaryKeyValue } from '@/lib/features/handPickedRows/handPickedRowsSlice'
import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import PrimaryKeyDropdown from '@/components/settings/PrimaryKeyDropdown'

ModuleRegistry.registerModules([AllCommunityModule])

/**
 * Escape a primary key value for use in SQL IN clause
 */
function escapePkValue(value: PrimaryKeyValue): string {
  if (value === null) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  // String: escape single quotes by doubling them
  return `'${String(value).replace(/'/g, "''")}'`
}

const HandPickedRowsTable = memo(function HandPickedRowsTable() {
  const dispatch = useAppDispatch()
  const pickedKeys = useAppSelector((state) => state.handPickedRows.pickedKeys)
  const primaryKeyColumn = useAppSelector((state) => state.ui.primaryKeyColumn)
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const theme = useAGGridTheme()
  const { ag: baseColumnDefs } = useAg()
  const renderTypeColumns = useRenderType()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  const [rowData, setRowData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch hand-picked rows via SQL query
  const fetchHandPickedRows = useCallback(async () => {
    if (!tablePath || !primaryKeyColumn || pickedKeys.length === 0) {
      setRowData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const inClause = pickedKeys.map(escapePkValue).join(', ')
      const sql = `SELECT * FROM '${tablePath}' WHERE "${primaryKeyColumn}" IN (${inClause})`
      const result = await executeQueryAsListOfDict(sql, 'handpicked_rows', dispatch)
      setRowData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rows')
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [tablePath, primaryKeyColumn, pickedKeys, dispatch])

  useEffect(() => {
    fetchHandPickedRows()
  }, [fetchHandPickedRows])

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

  const handleClearAll = () => {
    dispatch(clearHandPickedRows())
  }

  const handleCopyIds = async () => {
    try {
      const json = JSON.stringify(pickedKeys)
      await navigator.clipboard.writeText(json)
      toast.success('Copied IDs to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (pickedKeys.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-2 border-b">
          <PrimaryKeyDropdown />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No Hand-Picked Rows</h3>
            <p className="text-muted-foreground">
              {primaryKeyColumn
                ? 'Command+Click (or Ctrl+Click) a row to hand-pick it here.'
                : 'Please select a primary key column first.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!primaryKeyColumn) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-2 border-b">
          <PrimaryKeyDropdown />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Primary Key Not Set</h3>
            <p className="text-muted-foreground">
              Please select a primary key column to view hand-picked rows.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {pickedKeys.length} row(s) picked with keys: {pickedKeys.slice(0, 5).join(', ')}
              {pickedKeys.length > 5 && '...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {loading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${rowData.length} picked row(s)`
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyIds}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy IDs
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1">
        <AgGridReact
          theme={theme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={rowHeight}
          animateRows={false}
          pagination={false}
        />
      </div>
    </div>
  )
})

export default HandPickedRowsTable
