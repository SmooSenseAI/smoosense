'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { BubblePlotGroup } from '@/lib/features/bubblePlot/bubblePlotSlice'
import { BUBBLE_SIZE_COLOR_VALUE } from '@/lib/features/bubblePlot/BubblePlotMoreControls'
import type { PlotData, Layout, Config } from 'plotly.js'
import { usePlotlyLayout, usePlotlyConfig, usePlotlyColors } from '@/lib/utils/plotlyTheme'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import { setNeedRefresh } from '@/lib/features/rowData/rowDataSlice'

// Dynamically import Plotly to avoid SSR issues
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

interface PlotlyBubblePlotProps {
  data: BubblePlotGroup[]
}

const PlotlyBubblePlot = React.memo(function PlotlyBubblePlot({ data }: PlotlyBubblePlotProps) {
  const dispatch = useAppDispatch()
  const [isClient, setIsClient] = useState(false)
  const [plotlyError, setPlotlyError] = useState<string | null>(null)

  const xColumn = useAppSelector((state) => state.ui.bubblePlotXColumn)
  const yColumn = useAppSelector((state) => state.ui.bubblePlotYColumn)
  const breakdownColumn = useAppSelector((state) => state.ui.bubblePlotBreakdownColumn)
  const maxMarkerSize = useAppSelector((state) => state.ui.bubblePlotMaxMarkerSize)
  const minMarkerSize = useAppSelector((state) => state.ui.bubblePlotMinMarkerSize)
  const opacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const markerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)
  const colorColumn = useAppSelector((state) => state.ui.bubblePlotColorColumn)
  const colorScale = useAppSelector((state) => state.ui.bubblePlotColorScale)

  // Get theme colors for marker styling
  const colors = usePlotlyColors()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const plotData = useMemo((): Partial<PlotData>[] => {
    if (!data || !Array.isArray(data)) {
      return []
    }

    try {
      // Check if we have color values and should use color scale
      const hasColorValues = colorColumn && data.some(item =>
        item.customdata.some(c => c.colorValue !== null)
      )

      const plotlyData = data.map((item) => {
        const markerSizes = item.customdata.map(c => {
          // Shifted logistic function: markerSize = 2 * maxMarkerSize * (1 / (1 + exp(-markerSizeContrastRatio * count)) - 0.5)
          const k = Math.exp(-markerSizeContrastRatio)
          const logisticValue = 1 / (1 + Math.exp(-k * c.count))
          return Math.max(minMarkerSize, 2 * maxMarkerSize * (logisticValue - 0.5))
        })

        // Build marker config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker: any = {
          size: markerSizes,
          opacity: opacity,
          line: {
            width: 0.5,
            color: colors.foreground
          }
        }

        // Add color mapping if color column is selected
        if (hasColorValues) {
          marker.color = item.customdata.map(c => c.colorValue ?? 0)
          marker.colorscale = colorScale
          marker.showscale = true
          marker.colorbar = {
            title: colorColumn === BUBBLE_SIZE_COLOR_VALUE ? 'Bubble Size' : colorColumn,
            thickness: 15,
            len: 0.5
          }
        }

        const trace: Partial<PlotData> = {
          x: item.x,
          y: item.y,
          name: item.name,
          mode: 'markers',
          type: 'scatter',
          marker,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customdata: item.customdata as any,
          hovertemplate:
            `<b>X ${xColumn}:</b> ~%{x}<br>` +
            `<b>Y ${yColumn}:</b> ~%{y}<br>` +
            (breakdownColumn ? `<b>${breakdownColumn}:</b> ${item.name}<br>` : '') +
            `<b>Count:</b> %{customdata.count}<br>` +
            (hasColorValues && colorColumn !== BUBBLE_SIZE_COLOR_VALUE ? `<b>${colorColumn}:</b> %{customdata.colorValue:.2f}<br>` : '') +
            '<extra></extra>',
        }
        return trace
      })
      return plotlyData
    } catch (error) {
      console.error('Error preparing plot data:', error)
      setPlotlyError((error as Error).message)
      return []
    }
  }, [data, xColumn, yColumn, breakdownColumn, colorColumn, colorScale, opacity, maxMarkerSize, minMarkerSize, markerSizeContrastRatio, colors.foreground])

  // Get display name for color column
  const colorDisplayName = colorColumn === BUBBLE_SIZE_COLOR_VALUE ? 'Bubble Size' : colorColumn

  const baseLayout = usePlotlyLayout({
    showLegend: breakdownColumn !== null
  })
  
  const layout = useMemo((): Partial<Layout> => ({
    ...baseLayout,
    selectdirection: 'any',
    dragmode: 'lasso'
  }), [baseLayout])

  const baseConfig = usePlotlyConfig()
  
  const config = useMemo((): Partial<Config> => ({
    ...baseConfig,
    displayModeBar: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d', 'toImage', 'select2d', 'zoom2d'] as any,
  }), [baseConfig])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((plotlyData: any) => {
    try {
      if (plotlyData.points && plotlyData.points.length > 0) {
        const point = plotlyData.points[0]
        const condExpr = point.customdata?.condExpr
        if (condExpr) {
          dispatch(setSamplingCondition(condExpr))
          dispatch(setNeedRefresh(true))
        }
      }
    } catch (error) {
      console.error('Error handling click:', error)
    }
  }, [dispatch])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelected = useCallback((eventData: any) => {
    try {
      if (eventData && eventData.points && eventData.points.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const condExpr = eventData.points.map((p: any) => `(${p.customdata?.condExpr})`).join(' OR ')
        if (condExpr) {
          console.log('Selection condition:', condExpr)
          dispatch(setSamplingCondition(condExpr))
          dispatch(setNeedRefresh(true))
        }
      }
    } catch (error) {
      console.error('Error handling selection:', error)
    }
  }, [dispatch])

  // Compute bubble stats for info line
  const bubbleStats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, minSize: 0, maxSize: 0 }

    const allCounts = data.flatMap(group => group.customdata.map(c => c.count))
    const total = data.reduce((sum, group) => sum + group.customdata.length, 0)
    const minSize = allCounts.length > 0 ? Math.min(...allCounts) : 0
    const maxSize = allCounts.length > 0 ? Math.max(...allCounts) : 0

    return { total, minSize, maxSize }
  }, [data])

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (plotlyError) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-background text-destructive flex-col gap-2">
        <div>Error loading chart</div>
        <div className="text-xs opacity-70">{plotlyError}</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col">
      <div className="flex-1 min-h-0">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
          onClick={handleClick}
          onSelected={handleSelected}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError={(error: any) => {
            console.error('Plotly error:', error)
            setPlotlyError(error.message || 'Unknown plotting error')
          }}
        />
      </div>
      <div className="flex-shrink-0 px-4 py-1 text-sm text-muted-foreground border-t flex">
        <div>
          x: {xColumn} | y: {yColumn}
          {colorColumn && ` | color: ${colorDisplayName}`}
          {breakdownColumn && ` | breakdown: ${breakdownColumn}`}
        </div>
        <div className="flex-1" />
        <div>
          {bubbleStats.total} bubbles | size: {bubbleStats.minSize.toLocaleString()} to {bubbleStats.maxSize.toLocaleString()}
        </div>
      </div>
    </div>
  )
})

export default PlotlyBubblePlot