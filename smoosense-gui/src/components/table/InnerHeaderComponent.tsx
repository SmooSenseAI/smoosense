'use client'

import { IHeaderParams } from 'ag-grid-community'
import { useColumnMeta } from '@/lib/hooks'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function InnerHeaderComponent(props: IHeaderParams) {
  const { columns } = useColumnMeta()
  const columnName = props.column.getColId()

  // Find column metadata
  const columnMeta = columns.find(col => col.column_name === columnName)
  const duckdbType = columnMeta?.duckdbType || 'Unknown'

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="ag-header-cell-text overflow-hidden"
            style={{
              direction: 'rtl',
              textAlign: 'left',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {props.displayName}
          </span>
        </TooltipTrigger>
        <TooltipContent className="w-[300px]">
          <div className="text-xs whitespace-normal break-words">
            <div className="font-semibold py-1">{columnName}</div>
            <div className="">Type: {duckdbType}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
