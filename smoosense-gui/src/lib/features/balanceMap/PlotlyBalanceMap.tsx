'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppSelector, useAppDispatch, useColFilteredStats } from '@/lib/hooks'
import type { BalanceMapGroup } from './balanceMapSlice'
import type { PlotData, Layout, Config } from 'plotly.js'
import { usePlotlyLayout, usePlotlyConfig, usePlotlyColors } from '@/lib/utils/plotlyTheme'
import { histogramToColor } from '@/lib/utils/balanceColorMapping'
import { setSamplingCondition } from '@/lib/features/viewing/viewingSlice'
import { setNeedRefresh } from '@/lib/features/rowData/rowDataSlice'
import BalanceMapTooltip from './BalanceMapTooltip'
import _ from 'lodash'

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

interface PlotlyBalanceMapProps {
  data: BalanceMapGroup[]
}

const PlotlyBalanceMap = React.memo(function PlotlyBalanceMap({ data }: PlotlyBalanceMapProps) {
  const dispatch = useAppDispatch()
  const [isClient, setIsClient] = useState(false)
  const [plotlyError, setPlotlyError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    data: {
      xValue: number
      yValue: number
      count: number
      breakdownHistogram: Record<string, number>
    } | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  })

  const xColumn = useAppSelector((state) => state.ui.bubblePlotXColumn)
  const yColumn = useAppSelector((state) => state.ui.bubblePlotYColumn)
  const breakdownColumn = useAppSelector((state) => state.ui.bubblePlotBreakdownColumn)
  const maxMarkerSize = useAppSelector((state) => state.ui.bubblePlotMaxMarkerSize)
  const opacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const markerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)

  // Get breakdown column stats to get total counts for normalization
  const { data: breakdownStatsData } = useColFilteredStats(breakdownColumn || '')

  // Get theme colors for marker styling
  const colors = usePlotlyColors()

  // Extract total counts and all breakdown values
  const { breakdownTotalCounts, allBreakdownValues } = useMemo(() => {
    if (!breakdownColumn || !breakdownStatsData || !('cnt_values' in breakdownStatsData)) {
      return { breakdownTotalCounts: {}, allBreakdownValues: [] }
    }

    const cntValues = breakdownStatsData.cnt_values as Array<{ value: string; cnt: number }>
    const totalCounts = _(cntValues)
      .keyBy(item => String(item.value))
      .mapValues(item => item.cnt)
      .value()

    const allValues = _(cntValues)
      .sortBy(item => -item.cnt) // Sort by count descending (using negative for desc order)
      .map(item => String(item.value))
      .value()

    return { breakdownTotalCounts: totalCounts, allBreakdownValues: allValues }
  }, [breakdownColumn, breakdownStatsData])

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
            color: item.customdata.map(c => {
              // Always use ratio mode - normalize by total counts
              const normalizedHistogram: Record<string, number> = {}

              for (const [value, count] of Object.entries(c.breakdownHistogram)) {
                const totalCount = breakdownTotalCounts[value]
                normalizedHistogram[value] = totalCount > 0 ? count / totalCount : 0
              }

              return histogramToColor(normalizedHistogram, allBreakdownValues)
            }),
            opacity: opacity,
            line: {
              width: 1,
              color: colors.foreground
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customdata: item.customdata as any,
          hovertemplate: '',
          hoverinfo: 'none',
        }
        return trace
      })
      return plotlyData
    } catch (error) {
      console.error('Error preparing plot data:', error)
      setPlotlyError((error as Error).message)
      return []
    }
  }, [data, opacity, maxMarkerSize, markerSizeContrastRatio, breakdownTotalCounts, allBreakdownValues, colors.foreground])

  const baseLayout = usePlotlyLayout({
    xTitle: `X: ${xColumn}`,
    yTitle: `Y: ${yColumn}`,
    showLegend: false
  })

  const layout = useMemo((): Partial<Layout> => ({
    ...baseLayout,
    selectdirection: 'any',
    dragmode: 'pan'
  }), [baseLayout])

  const baseConfig = usePlotlyConfig()

  const config = useMemo((): Partial<Config> => ({
    ...baseConfig,
    displayModeBar: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d', 'select2d', 'lasso', 'zoom2d'] as any,
  }), [baseConfig])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((plotlyData: any) => {
    try {
      if (plotlyData.points && plotlyData.points.length > 0) {
        const point = plotlyData.points[0]
        const condExpr = point.customdata?.condExpr
        console.log(point.customdata)
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
  const handleHover = useCallback((plotlyData: any) => {
    try {
      if (plotlyData.points && plotlyData.points.length > 0) {
        const point = plotlyData.points[0]
        const event = plotlyData.event

        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          data: {
            xValue: point.x,
            yValue: point.y,
            count: point.customdata.count,
            breakdownHistogram: point.customdata.breakdownHistogram
          }
        })
      }
    } catch (error) {
      console.error('Error handling hover:', error)
    }
  }, [])

  const handleUnhover = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

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
    <div className="w-full h-full min-h-[400px] relative">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onClick={handleClick}
        onHover={handleHover}
        onUnhover={handleUnhover}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError={(error: any) => {
          console.error('Plotly error:', error)
          setPlotlyError(error.message || 'Unknown plotting error')
        }}
      />

      {/* Custom tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <BalanceMapTooltip
            x={tooltip.data.xValue}
            y={tooltip.data.yValue}
            xColumn={xColumn}
            yColumn={yColumn}
            count={tooltip.data.count}
            breakdownHistogram={tooltip.data.breakdownHistogram}
            breakdownTotalCounts={breakdownTotalCounts}
            allBreakdownValues={allBreakdownValues}
            visible={tooltip.visible}
          />
        </div>
      )}
    </div>
  )
})

export default PlotlyBalanceMap