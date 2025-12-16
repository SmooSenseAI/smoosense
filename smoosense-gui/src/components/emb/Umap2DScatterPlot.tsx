'use client'

import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { PlotData, Layout, Config } from 'plotly.js'
import { usePlotlyLayout, usePlotlyConfig, usePlotlyColors } from '@/lib/utils/plotlyTheme'
import { useAppSelector } from '@/lib/hooks'
import HoverItem from '@/components/emb/HoverItem'
import { RenderType } from '@/lib/utils/agGridCellRenderers'

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-background text-muted-foreground">
      <div className="text-center">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    </div>
  )
})

interface HoverInfo {
  index: number
  x: number
  y: number
  screenX: number
  screenY: number
}

interface Umap2DScatterPlotProps {
  x: number[]
  y: number[]
  visualValues?: unknown[]
  captionValues?: unknown[]
  breakdownValues?: unknown[]
  colorValues?: number[]
  visualRenderType?: RenderType
  onSelectionChange?: (indices: number[], type: 'click' | 'lasso') => void
}

const Umap2DScatterPlot = React.memo(function Umap2DScatterPlot({
  x,
  y,
  visualValues,
  captionValues,
  breakdownValues,
  colorValues,
  visualRenderType = RenderType.ImageUrl,
  onSelectionChange
}: Umap2DScatterPlotProps) {
  const [isClient, setIsClient] = useState(false)
  const [plotlyError, setPlotlyError] = useState<string | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const colors = usePlotlyColors()
  const markerSize = useAppSelector((state) => state.ui.bubblePlotMinMarkerSize)
  const opacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const colorScale = useAppSelector((state) => state.ui.bubblePlotColorScale)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIndices([])
  }, [x, y])

  const hasColorValues = colorValues && colorValues.length > 0

  const plotData = useMemo((): Partial<PlotData>[] => {
    if (!x || !y || x.length === 0) {
      return []
    }

    // If breakdown column is provided, create multiple traces
    if (breakdownValues && breakdownValues.length > 0) {
      // Group indices by breakdown value
      const groups = new Map<string, number[]>()
      breakdownValues.forEach((val, i) => {
        const key = String(val ?? 'null')
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(i)
      })

      // Create a trace for each group
      const traces: Partial<PlotData>[] = []
      const groupNames = Array.from(groups.keys()).sort()

      groupNames.forEach((groupName, groupIndex) => {
        const indices = groups.get(groupName)!
        const groupX = indices.map(i => x[i])
        const groupY = indices.map(i => y[i])
        const groupColorValues = hasColorValues ? indices.map(i => colorValues[i]) : undefined
        const customdata = indices.map(i => ({ index: i }))

        // Determine marker color
        let markerColor: string | number[] | undefined
        if (groupColorValues && groupColorValues.length > 0) {
          markerColor = groupColorValues
        }

        traces.push({
          x: groupX,
          y: groupY,
          mode: 'markers',
          type: 'scattergl',
          name: groupName,
          marker: {
            size: markerSize,
            opacity: opacity,
            color: markerColor,
            colorscale: hasColorValues ? colorScale : undefined,
            showscale: hasColorValues && groupIndex === 0, // Only show colorbar on first trace
            colorbar: hasColorValues ? {
              thickness: 15,
              len: 0.5
            } : undefined,
            line: {
              width: 0.5,
              color: colors.foreground
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customdata: customdata as any,
          hoverinfo: 'none',
        })
      })

      return traces
    }

    // Single trace (no breakdown)
    // Determine marker color based on colorValues or selection
    let markerColor: string[] | number[]
    if (hasColorValues) {
      markerColor = colorValues
    } else {
      markerColor = x.map((_, i) =>
        selectedIndices.includes(i) ? '#f97316' : colors.primary
      )
    }

    // Store index in customdata for click handling
    const customdata = x.map((_, i) => ({ index: i }))

    return [{
      x,
      y,
      mode: 'markers',
      type: 'scattergl',
      marker: {
        size: markerSize,
        opacity: opacity,
        color: markerColor,
        colorscale: hasColorValues ? colorScale : undefined,
        showscale: hasColorValues,
        colorbar: hasColorValues ? {
          thickness: 15,
          len: 0.5
        } : undefined,
        line: {
          width: 0.5,
          color: colors.foreground
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customdata: customdata as any,
      hoverinfo: 'none', // Disable default hover
    }]
  }, [x, y, selectedIndices, colors.primary, colors.foreground, markerSize, opacity, colorScale, breakdownValues, colorValues, hasColorValues])

  const hasBreakdown = breakdownValues && breakdownValues.length > 0

  const baseLayout = usePlotlyLayout({
    showLegend: hasBreakdown
  })

  const layout = useMemo((): Partial<Layout> => ({
    ...baseLayout,
    dragmode: 'lasso',
    hovermode: 'closest',
    showlegend: hasBreakdown,
    margin: {
      l: 0,
      r: 0,
      t: hasBreakdown ? 30 : 0,
      b: 0,
    },
  }), [baseLayout, hasBreakdown])

  const baseConfig = usePlotlyConfig()

  const config = useMemo((): Partial<Config> => ({
    ...baseConfig,
    displayModeBar: true,
    scrollZoom: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d', 'toImage'] as any,
  }), [baseConfig])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelected = useCallback((event: any) => {
    if (event && event.points && event.points.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const indices = event.points.map((p: any) => p.customdata?.index ?? p.pointIndex ?? p.pointNumber)
      setSelectedIndices(indices)
      onSelectionChange?.(indices, 'lasso')
    }
  }, [onSelectionChange])

  const handleDeselect = useCallback(() => {
    setSelectedIndices([])
    onSelectionChange?.([], 'lasso')
  }, [onSelectionChange])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHover = useCallback((event: any) => {
    if (event && event.points && event.points.length > 0) {
      const point = event.points[0]
      const index = point.customdata?.index ?? point.pointIndex ?? point.pointNumber

      // Get screen position from event
      const bbox = event.event?.target?.getBoundingClientRect?.()
      const screenX = event.event?.clientX ?? (bbox?.left ?? 0) + (bbox?.width ?? 0) / 2
      const screenY = event.event?.clientY ?? (bbox?.top ?? 0) + (bbox?.height ?? 0) / 2

      setHoverInfo({
        index,
        x: point.x,
        y: point.y,
        screenX,
        screenY,
      })
    }
  }, [])

  const handleUnhover = useCallback(() => {
    setHoverInfo(null)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    )
  }

  if (plotlyError) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-background text-destructive flex-col gap-2">
        <div>Error loading chart</div>
        <div className="text-xs opacity-70">{plotlyError}</div>
      </div>
    )
  }

  // Calculate tooltip position relative to container
  const getTooltipStyle = () => {
    if (!hoverInfo || !containerRef.current) return { display: 'none' }

    const containerRect = containerRef.current.getBoundingClientRect()
    const tooltipWidth = 150
    const tooltipHeight = 180

    let left = hoverInfo.screenX - containerRect.left + 10
    let top = hoverInfo.screenY - containerRect.top + 10

    // Adjust if tooltip would go off right edge
    if (left + tooltipWidth > containerRect.width) {
      left = hoverInfo.screenX - containerRect.left - tooltipWidth - 10
    }

    // Adjust if tooltip would go off bottom edge
    if (top + tooltipHeight > containerRect.height) {
      top = hoverInfo.screenY - containerRect.top - tooltipHeight - 10
    }

    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000,
    }
  }

  const hasVisualData = visualValues && visualValues.length > 0

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onSelected={handleSelected}
        onDeselect={handleDeselect}
        onHover={handleHover}
        onUnhover={handleUnhover}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError={(error: any) => {
          console.error('Plotly error:', error)
          setPlotlyError(error.message || 'Unknown plotting error')
        }}
      />

      {/* Custom hover tooltip with HoverItem */}
      {hoverInfo && hasVisualData && (
        <div
          style={getTooltipStyle()}
          className="pointer-events-none bg-background border rounded-lg shadow-lg overflow-hidden"
        >
          <HoverItem
            row={{}}
            index={hoverInfo.index}
            visualValue={visualValues[hoverInfo.index]}
            captionValue={captionValues?.[hoverInfo.index] ?? null}
            renderType={visualRenderType}
          />
        </div>
      )}
    </div>
  )
})

export default Umap2DScatterPlot
