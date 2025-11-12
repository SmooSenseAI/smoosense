'use client'

import {memo, useCallback, useState} from 'react'
import {useAppSelector, useColFilteredStats, useSingleColumnRenderType} from '@/lib/hooks'
import {ICellRendererParams} from 'ag-grid-community'
import {Loader2} from 'lucide-react'
import {FilterType} from '@/lib/features/filters/types'
import {RenderType} from '@/lib/utils/agGridCellRenderers'
import {CategoricalCntValue, HistogramCntValue} from '@/lib/features/colStats/types'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import MiniHistogram from '@/components/charts/MiniHistogram'
import MiniTreeMap from '@/components/charts/MiniTreeMap'
import MiniTextFilter from '@/components/charts/MiniTextFilter'
import ColumnFilterCard from '@/lib/features/filters/ColumnFilterCard'
import NullPie from '@/components/charts/NullPie'

interface HeaderStatsCellRendererImplProps {
  columnName: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  showColumnName?: boolean
}

const HeaderStatsCellRendererImpl = memo(function HeaderStatsCellRendererImpl({ 
  columnName,
  side = 'right',
  showColumnName = false
}: HeaderStatsCellRendererImplProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Always call hooks at the top level
  const colStats = useColFilteredStats(columnName)
  const columnFilter = useAppSelector((state) => state.ag.filters[columnName])
  const renderType = useSingleColumnRenderType(columnName)
  
  // Check if the column filter is active
  const isActive = columnFilter != null

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false)
  }, [])

  const handleOpenPopover = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsPopoverOpen(!isPopoverOpen)
  }, [isPopoverOpen])
  
  // Stats data (now using the refactored hook)
  const statsData = colStats.data
  const statsError = colStats.error
  const hasStatsData = colStats.hasData
  const isStatsLoading = colStats.loading

  // Extract cnt_values for easier access
  const cntValues = statsData && 'cnt_values' in statsData ? statsData.cnt_values : []


  const cellContent = (
    <div 
      className={`
        flex items-center justify-center h-full w-full
        border rounded-sm border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900
        transition-colors duration-200 
        hover:shadow-sm relative 
      `}
    >
      {/* Flex layout with NullPie and main chart */}
      {hasStatsData && statsData ? (
        <div className="w-full h-full p-1 flex items-center gap-1">
          {/* NullPie with fixed width */}
          {'cnt_null' in statsData && 'cnt_not_null' in statsData && (
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={handleOpenPopover}
            >
              <NullPie 
                cntNull={statsData.cnt_null}
                cntNotNull={statsData.cnt_not_null}
              />
            </div>
          )}
          
          {/* Main chart takes remaining space */}
          <div className="flex-1 h-full">
            {statsData.type === FilterType.RANGE && cntValues?.length > 0 && (
              <div 
                className="w-full h-full cursor-pointer"
                onClick={handleOpenPopover}
              >
                <MiniHistogram 
                  data={cntValues as HistogramCntValue[]}
                  isActive={isActive}
                />
              </div>
            )}
            {statsData.type === FilterType.ENUM && cntValues?.length > 0 && (
              <div 
                className="w-full h-full cursor-pointer"
                onClick={handleOpenPopover}
              >
                <MiniTreeMap 
                  data={cntValues as CategoricalCntValue[]}
                  isActive={isActive}
                />
              </div>
            )}
            {statsData.type === FilterType.TEXT && renderType === RenderType.Text && (
              <MiniTextFilter 
                columnName={columnName}
              />
            )}
          </div>

        </div>
      ) : (
        // Empty state when no chart data - show NullPie if available, otherwise loading/empty state
        <div className="w-full h-full p-1 flex items-center justify-center">
          {hasStatsData && statsData && 'cnt_null' in statsData && 'cnt_not_null' in statsData ? (
            // Show only NullPie when no main chart data
            <NullPie 
              cntNull={statsData.cnt_null}
              cntNotNull={statsData.cnt_not_null}
            />
          ) : (
            // Show loading or empty state
            <div className="flex items-center justify-center w-full h-full">
              {isStatsLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-xs text-muted-foreground opacity-50">
                  No chart
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const popoverContent = (
    <div className="w-full">
      {isStatsLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading statistics...
        </div>
      )}
      
      {!isStatsLoading && statsError && (
        <div className="p-4">
          <div className="text-sm text-destructive">
            Error: {statsError}
          </div>
        </div>
      )}
      
      {!isStatsLoading && !statsData && !statsError && (
        <div className="p-4">
          <div className="text-sm text-muted-foreground">
            No statistics available
          </div>
        </div>
      )}
      
      {statsData && (
        <ColumnFilterCard
          columnName={columnName}
          onClose={handleClosePopover}
        />
      )}
      

    </div>
  )

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className={`header-stats-trigger w-full h-full cursor-pointer ${showColumnName ? 'flex flex-col' : ''} ${isPopoverOpen ? 'ring-1 ring-primary ring-inset rounded' : ''}`}
          style={{padding: '1px'}}
          data-col-name={columnName}
        >
          {showColumnName && (
            <div className="text-sm font-medium text-foreground px-2 py-1 border-b border-border rounded bg-muted/30">
              {columnName}
            </div>
          )}
          <div className={`${showColumnName ? 'flex-1 w-full' : 'w-full h-full'}`}>
            {cellContent}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-[500px] max-h-[600px] overflow-auto p-0 shadow-xl dark:shadow-violet-800/10">
        {popoverContent}
      </PopoverContent>
    </Popover>
  )
})

const HeaderStatsCellRenderer = memo(function HeaderStatsCellRenderer({ colDef }: ICellRendererParams) {
  const columnName = colDef?.field

  if (!columnName) {
    return <div className="p-2 text-xs text-muted-foreground">Unknown Column</div>
  }

  return <HeaderStatsCellRendererImpl columnName={columnName} side="bottom" />
})

export default HeaderStatsCellRenderer
export { HeaderStatsCellRendererImpl }