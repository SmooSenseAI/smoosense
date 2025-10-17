'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setColumnFilter } from '@/lib/features/colDefs/agSlice'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FilterStatusChips() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.ag.filters)

  // Get list of columns with active filters
  const activeFilters = Object.entries(filters)
    .filter(([, filter]) => filter !== undefined)
    .map(([columnName]) => columnName)

  const handleClearFilter = (columnName: string) => {
    dispatch(setColumnFilter({ columnName, filter: undefined }))
  }

  // Don't render anything if no filters are active
  if (activeFilters.length === 0) {
    return <span className="text-xs text-muted-foreground font-medium">No filters applied</span>
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-muted-foreground font-medium">Filters:</span>
      <div className="flex items-center space-x-1">
        {activeFilters.map((columnName) => (
          <Badge
            key={columnName}
            variant="secondary"
            className={cn(
              "flex items-center gap-1 px-2 py-1",
              "hover:bg-secondary/80 transition-colors"
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
    </div>
  )
}