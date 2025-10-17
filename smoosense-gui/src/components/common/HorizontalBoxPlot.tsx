'use client'

import React from 'react'
import { useTheme } from 'next-themes'

interface BoxPlotData {
  min: number
  q25: number
  q50: number
  q75: number
  max: number
  avg: number
  globalMin?: number
  globalMax?: number
}

interface HorizontalBoxPlotProps {
  data: BoxPlotData
  width?: number
  strokeWidth?: number
}

export const HorizontalBoxPlot = React.memo<HorizontalBoxPlotProps>(function HorizontalBoxPlot({
  data,
  width = 200,
  strokeWidth = 2,
}) {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

  const totalHeight = 28

  if (!data || data.avg === null || data.avg === undefined) {
    return null
  }

  const plotHeight = 16
  const centerY = totalHeight / 2
  const plotY1 = centerY - plotHeight / 2
  const plotY2 = centerY + plotHeight / 2
  const { min, q25, q50, q75, max, avg } = data
  const globalMin = data.globalMin ?? min
  const globalMax = data.globalMax ?? max

  const padding = 4
  const mapped = (value: number) => padding + (value - globalMin) * (width - 2 * padding) / (globalMax - globalMin)

  // Theme colors based on dark mode
  const colors = {
    primary: isDark ? '#e4e4e7' : '#27272a',
    secondary: isDark ? '#71717a' : '#a1a1aa',
    background: isDark ? '#18181b' : '#ffffff',
    plotFill: isDark ? '#3f3f46' : '#f4f4f5',
    warning: '#f59e0b'
  }

  const VerticalLine = ({ x }: { x: number }) => {
    return (
      <line 
        x1={x} 
        x2={x} 
        y1={plotY1} 
        y2={plotY2}
        stroke={colors.primary} 
        strokeWidth={strokeWidth}
      />
    )
  }

  if (globalMin === globalMax) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        Single value: {globalMin}
      </div>
    )
  }

  return (
    <svg 
      width={width} 
      height={totalHeight} 
      style={{ backgroundColor: colors.background }}
      className="border rounded"
    >
      {/* Center line */}
      <line
        x1={mapped(min)} 
        x2={mapped(max)} 
        y1={centerY} 
        y2={centerY}
        stroke={colors.secondary} 
        strokeWidth={strokeWidth} 
        strokeDasharray="5,5"
      />
      
      {/* Box */}
      <rect
        x={mapped(q25)} 
        y={plotY1} 
        width={mapped(q75) - mapped(q25)} 
        height={plotHeight}
        stroke={colors.primary} 
        strokeWidth={strokeWidth} 
        fill={colors.plotFill}
      />
      
      {/* Vertical lines for min, median, max */}
      <VerticalLine x={mapped(min)} />
      <VerticalLine x={mapped(q50)} />
      <VerticalLine x={mapped(max)} />
      
      {/* Average point */}
      <circle 
        cx={mapped(avg)} 
        cy={centerY} 
        r={4} 
        fill={colors.warning} 
      />
    </svg>
  )
})

export default HorizontalBoxPlot