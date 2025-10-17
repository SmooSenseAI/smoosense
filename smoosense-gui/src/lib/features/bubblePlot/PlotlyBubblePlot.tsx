'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import type { BubblePlotGroup } from './bubblePlotSlice'
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
  const opacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const markerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)

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
      const plotlyData = data.map((item) => {

        const trace: Partial<PlotData> = {
          x: item.x,
          y: item.y,
          name: item.name,
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: item.customdata.map(c => {
              // Shifted logistic function: markerSize = 2 * maxMarkerSize * (1 / (1 + exp(-markerSizeContrastRatio * count)) - 0.5)
              const k = Math.exp(-markerSizeContrastRatio)
              const logisticValue = 1 / (1 + Math.exp(-k * c.count))
              return Math.max(1, 2 * maxMarkerSize * (logisticValue - 0.5))
            }),
            opacity: opacity,
            line: {
              width: 1,
              color: colors.foreground
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customdata: item.customdata as any,
          hovertemplate:
            `<b>X ${xColumn}:</b> ~%{x}<br>` +
            `<b>Y ${yColumn}:</b> ~%{y}<br>` +
            (breakdownColumn ? `<b>${breakdownColumn}:</b> ${item.name}<br>` : '') +
            `<b>Count:</b> %{customdata.count}<br>` +
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
  }, [data, xColumn, yColumn, breakdownColumn, opacity, maxMarkerSize, markerSizeContrastRatio, colors.foreground])

  const baseLayout = usePlotlyLayout({ 
    xTitle: `X: ${xColumn}`, 
    yTitle: `Y: ${yColumn}`,
    showLegend: true
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
    <div className="w-full h-full min-h-[400px]">
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
  )
})

export default PlotlyBubblePlot