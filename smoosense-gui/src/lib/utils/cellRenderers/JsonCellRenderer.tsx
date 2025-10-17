'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import JsonBox from '@/components/ui/JsonBox'
import { useAppSelector } from '@/lib/hooks'

interface JsonCellRendererProps {
  value: unknown
}

const JsonCellRenderer = memo(function JsonCellRenderer({ 
  value
}: JsonCellRendererProps) {
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const tableCellSpacing = useAppSelector((state) => state.ui.tableCellSpacing)

  const cellContent = (
    <div
      className="flex"
      style={{ maxHeight: `${rowHeight}px`, padding: `${tableCellSpacing}px` }}
    >
      <span className="flex-1 leading-tight text-sm break-words overflow-hidden rounded px-1">
        <code className="text-xs">{JSON.stringify(value)}</code>
      </span>
    </div>
  )

  const popoverContent = (
    <JsonBox 
      src={value as object} 
      className="h-full"
    />
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      popoverClassName="w-96 h-80 p-0"
      copyValue={JSON.stringify(value)}
    />
  )
})

export default JsonCellRenderer