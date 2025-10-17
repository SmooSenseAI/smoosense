'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useTotalRows } from '@/lib/hooks/useTotalRows'
import { 
  setPageSize, 
  nextPage, 
  previousPage, 
  firstPage, 
  lastPage,
  setSamplingCondition 
} from '@/lib/features/viewing/viewingSlice'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import ButtonRandomSamples from '@/components/common/ButtonRandomSamples'

export default function PaginationBar() {
  const dispatch = useAppDispatch()
  const pageSize = useAppSelector((state) => state.viewing.pageSize)
  const pageNumber = useAppSelector((state) => state.viewing.pageNumber)
  const samplingCondition = useAppSelector((state) => state.viewing.samplingCondition)
  const totalRows = useTotalRows()
  
  const pageSizeOptions = [10, 25, 50, 100]
  
  const handlePageSizeChange = (value: string) => {
    dispatch(setPageSize(Number(value)))
  }
  
  const handleFirstPage = () => {
    dispatch(firstPage())
  }
  
  const handlePreviousPage = () => {
    dispatch(previousPage())
  }
  
  const handleNextPage = () => {
    dispatch(nextPage())
  }
  
  const handleLastPage = () => {
    dispatch(lastPage())
  }
  
  const handleBackToPage = () => {
    dispatch(setSamplingCondition(null))
  }
  
  // Calculate pagination info
  const startRow = ((pageNumber - 1) * pageSize) + 1
  const endRow = Math.min(pageNumber * pageSize, totalRows || pageSize)
  const totalPages = totalRows ? Math.ceil(totalRows / pageSize) : 1
  const hasNextPage = totalRows ? pageNumber < totalPages : false
  const hasPreviousPage = pageNumber > 1
  
  return (
    <div className="flex items-center justify-between p-2 border-t bg-muted/30 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span>Page size: </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-20 text-xs justify-between font-normal cursor-pointer"
              >
                {pageSize}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-20">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => handlePageSizeChange(size.toString())}
                  className={size === pageSize ? "bg-accent" : ""}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* Random Samples Button */}
        <ButtonRandomSamples />
        
        {/* Current view info */}
        <div>
          {samplingCondition !== null ? (
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-attention">
                Showing {pageSize} random samples
              </span>

              <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToPage}
                  className="cursor-pointer text-attention"
              >
                Back to Page {pageNumber}
              </Button>
            </div>
          ) : totalRows ? (
            <>
              Showing {startRow.toLocaleString()}-{endRow.toLocaleString()} of {totalRows.toLocaleString()} rows
            </>
          ) : (
            <>
              Showing first {pageSize} rows
            </>
          )}
        </div>
      </div>
      
      {/* Navigation buttons - only show when not in sampling mode */}
      {samplingCondition === null && (
        <div className="flex items-center gap-1">
          {totalRows && (
            <span className="mr-2">
              Page {pageNumber} of {totalPages}
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFirstPage}
            disabled={!hasPreviousPage}
            className="h-7 w-7 p-0 cursor-pointer"
          >
            <ChevronFirst className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
            className="h-7 w-7 p-0 cursor-pointer"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="h-7 w-7 p-0 cursor-pointer"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLastPage}
            disabled={!hasNextPage}
            className="h-7 w-7 p-0 cursor-pointer"
          >
            <ChevronLast className="h-3 w-3" />
          </Button>
        </div>
      )}

    </div>
  )
}