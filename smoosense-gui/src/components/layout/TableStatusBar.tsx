'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { useTotalRows } from '@/lib/hooks/useTotalRows'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TableStatusBar() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.ag.filters)
  const sorting = useAppSelector((state) => state.ag.sorting)
  const sqlHistory = useAppSelector((state) => state.sqlHistory.executions)
  const totalRows = useTotalRows()

  // Get list of columns with active filters
  const activeFilters = Object.entries(filters)
    .filter(([, filter]) => filter !== undefined)
    .map(([columnName]) => columnName)

  // Count running SQL queries
  const runningQueryCount = Object.values(sqlHistory)
    .filter(execution => execution.result.status === 'running')
    .length

  // Get sorting status
  const sortingCount = sorting?.length ?? 0
  let sortingStatus: string
  if (sortingCount === 0) {
    sortingStatus = 'No sorting'
  } else if (sortingCount === 1) {
    const sort = sorting[0]
    sortingStatus = `Sorted by ${sort.field} (${sort.direction})`
  } else {
    const sortItems = sorting.map(sort => `${sort.field} (${sort.direction})`).join(', ')
    sortingStatus = `Sorted by ${sortItems}`
  }

  const handleClearFilter = (columnName: string) => {
    dispatch(setColumnFilter({ columnName, filter: undefined }))
  }

  return (

      <div className="flex items-center w-full space-x-4 text-xs text-muted-foreground">
        {/* Total Rows */}
        <span>{totalRows?.toLocaleString() ?? 0} rows</span>

        {/* Sorting */}
        <span>•</span>
        <span>{sortingStatus}</span>

        {/* Filters */}
        {activeFilters.length === 0 ? (
          <>
            <span>•</span>
            <span>No filters applied</span>
          </>
        ) : (
          <>
            <span>•</span>
            <span className="font-medium">Filters:</span>
            <div className="flex items-center space-x-1">
              {activeFilters.map((columnName) => (
                <Badge
                  key={columnName}
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 bg-primary",
                    "hover:bg-primary/80 transition-colors"
                  )}
                >
                  <span>{columnName}</span>
                  <button
                    onClick={() => handleClearFilter(columnName)}
                    className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={`Remove filter from ${columnName}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Loading Count - Always shown at the end */}
        <span>•</span>
        <span className={cn(
          runningQueryCount > 0 && "text-blue-600 dark:text-blue-400"
        )}>
          {runningQueryCount > 0 ? `Loading: ${runningQueryCount}` : 'Loaded'}
        </span>
      </div>



  )
}