'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import { useAppSelector } from '@/lib/hooks'

interface BulletListCellRendererProps {
  value: string[]
}

const BulletListCellRenderer = memo(function BulletListCellRenderer({
  value
}: BulletListCellRendererProps) {
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const tableCellSpacing = useAppSelector((state) => state.ui.tableCellSpacing)

  const cellContent = (
    <div
      className="overflow-hidden"
      style={{ maxHeight: `${rowHeight}px`, padding: `${tableCellSpacing}px` }}
    >
      <ul className="list-disc list-inside text-xs leading-tight">
        {value.map((item, index) => (
          <li key={index} className="truncate">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )

  const popoverContent = (
    <div className="p-3 overflow-auto h-full">
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, index) => (
          <li key={index} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      popoverClassName="w-96 max-h-80 p-0"
      copyValue={value.join('\n')}
      title={`${value.length} items`}
    />
  )
})

export default BulletListCellRenderer
