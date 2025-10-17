'use client'

import { useState, memo } from 'react'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { useAppSelector } from '@/lib/hooks'
import { RenderType } from '../agGridCellRenderers'
import { CLS } from '../styles'

interface DefaultCellRendererProps {
  value: unknown
  type: RenderType
}

const DefaultCellRenderer = memo(function DefaultCellRenderer({ 
  value, 
  type
}: DefaultCellRendererProps) {
  const [isHovered, setIsHovered] = useState(false)
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const tableCellSpacing = useAppSelector((state) => state.ui.tableCellSpacing)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  
  const getDisplayValue = () => {
    switch (type) {
      case RenderType.Null:
        return <span className="text-muted-foreground italic">null</span>
      case RenderType.Boolean:
        return String(value)
      case RenderType.Number:
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case RenderType.Date:
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }
        const dateValue = new Date(String(value))
        return !isNaN(dateValue.getTime()) ? dateValue.toLocaleDateString() : String(value)
      case RenderType.HyperLink:
        const url = String(value)
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={CLS.HYPERLINK}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        )
      default:
        return String(value)
    }
  }
  
  const getCopyValue = () => {
    return String(value)
  }

  // Simple cell content for basic types
  return (
    <div 
      className="relative w-full h-full flex items-start py-1"
      style={{ maxHeight: `${rowHeight}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="flex-1 leading-tight text-sm break-words overflow-hidden truncate" style={{padding: `${tableCellSpacing}px`}}>
        {getDisplayValue()}
      </span>
      {isHovered && ![RenderType.Null, RenderType.Boolean].includes(type) && (
        <div className="absolute top-0 right-0 z-10">
          <CopyToClipboard value={getCopyValue()} />
        </div>
      )}
    </div>
  )
})

export default DefaultCellRenderer