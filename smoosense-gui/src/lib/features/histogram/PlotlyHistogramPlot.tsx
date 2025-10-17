'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { HistogramGroup } from '@/lib/features/histogram/histogramSlice'
import { useHistogramLayout, usePlotlyConfig, usePlotlyColors } from '@/lib/utils/plotlyTheme'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import { setNeedRefresh } from '@/lib/features/rowData/rowDataSlice'
import dynamic from 'next/dynamic'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-background text-muted-foreground">
      <div className="text-center">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    </div>
  )
})

interface PlotlyHistogramPlotProps {
  data: HistogramGroup[]
}

const PlotlyHistogramPlot = React.memo<PlotlyHistogramPlotProps>(function PlotlyHistogramPlot({ data }) {
  const dispatch = useAppDispatch()
  const [isClient, setIsClient] = useState(false)
  const [plotlyError, setPlotlyError] = useState<string | null>(null)
  
  // Get current state
  const histogramBreakdownColumn = useAppSelector((state) => state.ui.histogramBreakdownColumn)
  const histogramColumn = useAppSelector((state) => state.ui.histogramColumn)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get theme colors using hooks
  const colors = usePlotlyColors()

  const plotData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return []
    }

    try {
      // Convert each data series to Plotly format
      const plotlyData = data.map((item) => ({
        x: item.x || [],
        y: item.y || [],
        name: item.name,
        type: 'bar' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customdata: item.customdata as any,
        hovertemplate:
          `<b>Count</b>: %{y}<br>` +
          (histogramBreakdownColumn ? `<b>${histogramBreakdownColumn}</b>: %{fullData.name}<br>` : '') +
          `<b>${histogramColumn}</b>: %{x}<br>` +
          '<extra></extra>',
        marker: {
          line: {
            color: colors.foreground,
            width: 1
          }
        }
      }))

      return plotlyData
    } catch (error) {
      console.error('Error preparing histogram plot data:', error)
      setPlotlyError(error instanceof Error ? error.message : 'Unknown error')
      return []
    }
  }, [data, colors, histogramBreakdownColumn, histogramColumn])

  const layout = useHistogramLayout({
    xTitle: histogramColumn || 'Value',
    yTitle: 'Count',
    barmode: 'stack'
  })

  const baseConfig = usePlotlyConfig()
  const config = useMemo(() => ({
    ...baseConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d', 'toImage'] as any,
  }), [baseConfig])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((plotlyData: any) => {
    try {
      if (plotlyData.points && plotlyData.points.length > 0) {
        const point = plotlyData.points[0]
        const condExpr = point.customdata?.condExpr
        if (condExpr) {
          // Set sampling condition and trigger refresh
          dispatch(setSamplingCondition(condExpr))
          dispatch(setNeedRefresh(true))
        }
      }
    } catch (error) {
      console.error('Error handling histogram click:', error)
    }
  }, [dispatch])

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (plotlyError) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-background text-destructive flex-col gap-2">
        <div className="text-lg font-medium">Error loading chart</div>
        <div className="text-sm opacity-70">{plotlyError}</div>
      </div>
    )
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No data to display</div>
          <div className="text-sm">Select histogram and breakdown columns to generate chart</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onClick={handleClick}
        onError={(error: Error) => {
          console.error('Plotly histogram error:', error)
          setPlotlyError(error.message || 'Unknown plotting error')
        }}
      />
    </div>
  )
})

export default PlotlyHistogramPlot