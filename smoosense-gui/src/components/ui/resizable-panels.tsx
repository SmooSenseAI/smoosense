'use client'

import React, { useState, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelsProps {
  children: ReactNode[]
  direction?: 'horizontal' | 'vertical'
  defaultSizes?: number[] // Percentages for each panel (should sum to ~100)
  minSize?: number // Percentage (0-100) - applies to all panels
  maxSize?: number // Percentage (0-100) - applies to all panels
  className?: string
}

export function ResizablePanels({
  children,
  direction = 'vertical',
  defaultSizes,
  minSize = 10,
  maxSize = 90,
  className,
}: ResizablePanelsProps) {
  // Initialize default sizes if not provided
  const initialSizes = defaultSizes || Array(children.length).fill(100 / children.length)
  const [sizes, setSizes] = useState<number[]>(initialSizes)
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((splitterIndex: number) => {
    setIsDragging(true)
    setDragIndex(splitterIndex)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || dragIndex === -1 || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      
      let position: number
      if (direction === 'vertical') {
        const y = e.clientY - rect.top
        position = (y / rect.height) * 100
      } else {
        const x = e.clientX - rect.left
        position = (x / rect.width) * 100
      }

      // Calculate cumulative size up to the splitter
      const cumulativeBeforeSplitter = sizes.slice(0, dragIndex + 1).reduce((sum, size) => sum + size, 0)
      const currentFirstPanelSize = sizes[dragIndex]
      const currentSecondPanelSize = sizes[dragIndex + 1]
      
      // Calculate new sizes for the two panels being resized
      const newFirstPanelSize = position - (cumulativeBeforeSplitter - currentFirstPanelSize)
      const newSecondPanelSize = currentFirstPanelSize + currentSecondPanelSize - newFirstPanelSize
      
      // Clamp sizes within bounds
      const clampedFirstSize = Math.max(minSize, Math.min(maxSize, newFirstPanelSize))
      const clampedSecondSize = Math.max(minSize, Math.min(maxSize, newSecondPanelSize))
      
      // Only update if both panels are within bounds
      if (clampedFirstSize + clampedSecondSize === newFirstPanelSize + newSecondPanelSize) {
        const newSizes = [...sizes]
        newSizes[dragIndex] = clampedFirstSize
        newSizes[dragIndex + 1] = clampedSecondSize
        setSizes(newSizes)
      }
    },
    [isDragging, dragIndex, direction, minSize, maxSize, sizes]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragIndex(-1)
  }, [])

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'vertical' ? 'row-resize' : 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction])

  const isVertical = direction === 'vertical'

  const renderPanelsAndSplitters = () => {
    const elements: ReactNode[] = []
    
    children.forEach((child, index) => {
      // Panel
      const panelStyle = isVertical 
        ? { height: `${sizes[index]}%` }
        : { width: `${sizes[index]}%` }
      
      elements.push(
        <div
          key={`panel-${index}`}
          style={panelStyle}
          className="overflow-hidden"
        >
          {child}
        </div>
      )
      
      // Splitter (don't add after last panel)
      if (index < children.length - 1) {
        elements.push(
          <div
            key={`splitter-${index}`}
            className={cn(
              'bg-border hover:bg-primary/50 active:bg-primary/50 transition-colors',
              'flex items-center justify-center',
              'group select-none',
              isVertical ? 'h-0.5 w-full cursor-row-resize' : 'w-0.5 h-full cursor-col-resize',
              isDragging && dragIndex === index && 'bg-primary'
            )}
            onMouseDown={() => handleMouseDown(index)}
          >
            {/* Visual indicator */}
            <div
              className={cn(
                'bg-border group-hover:bg-border/80 rounded-full',
                isVertical ? 'w-8 h-0.5' : 'h-8 w-0.5'
              )}
            />
          </div>
        )
      }
    })
    
    return elements
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex',
        isVertical ? 'flex-col' : 'flex-row',
        'h-full w-full',
        className
      )}
    >
      {renderPanelsAndSplitters()}
    </div>
  )
}