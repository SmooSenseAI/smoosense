'use client'

import { useState, useRef, useEffect, memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { useAppSelector } from '@/lib/hooks'

interface TextCellRendererProps {
  value: unknown
}

const TextCellRenderer = memo(function TextCellRenderer({ 
  value
}: TextCellRendererProps) {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)
  const tableCellSpacing = useAppSelector((state) => state.ui.tableCellSpacing)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  // Check for overflow dynamically
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textElement = textRef.current
        const containerElement = containerRef.current
        
        // Check both horizontal and vertical overflow
        const isHorizontalOverflow = textElement.scrollWidth > containerElement.clientWidth
        const isVerticalOverflow = textElement.scrollHeight > containerElement.clientHeight
        
        setIsOverflowing(isHorizontalOverflow || isVerticalOverflow)
      }
    }

    checkOverflow()
    
    // Use ResizeObserver to detect column width changes
    let resizeObserver: ResizeObserver
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(checkOverflow)
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [value])

  const cellContent = (
    <div 
      ref={containerRef}
      className={`relative flex`}
      style={{ maxHeight: `${rowHeight}px`, padding: `${tableCellSpacing}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span 
        ref={textRef}
        className="flex-1 leading-tight text-sm break-words overflow-hidden whitespace-pre-wrap"
      >
        {String(value)}
      </span>
      {isHovered && (
        <div className="absolute top-0 right-0 z-10">
          <CopyToClipboard value={String(value)} />
        </div>
      )}
    </div>
  )

  const popoverContent = (
    <div className="text-sm whitespace-pre-wrap break-words overflow-y-auto">
      {String(value)}
    </div>
  )

  // Handle overflowing text with popover
  if (isOverflowing) {
    return (
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        popoverClassName="w-200 max-w-[450px] p-4 bg-popover"
        side="top"
        align="start"
        copyValue={String(value)}
      />
    )
  }

  // Always show multi-line text, even when not overflowing
  return (
    <div 
      ref={containerRef}
      className={`relative flex`}
      style={{ maxHeight: `${rowHeight}px`, padding: `${tableCellSpacing}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span 
        ref={textRef}
        className="flex-1 leading-tight text-sm break-words overflow-hidden whitespace-pre-wrap"
      >
        {String(value)}
      </span>
      {isHovered && (
        <div className="absolute top-0 right-0 z-10">
          <CopyToClipboard value={String(value)} />
        </div>
      )}
    </div>
  )
})

export default TextCellRenderer