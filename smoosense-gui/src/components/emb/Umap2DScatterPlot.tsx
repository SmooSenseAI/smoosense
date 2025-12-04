'use client'

import React, { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { PlotData, Layout, Config } from 'plotly.js'
import { usePlotlyLayout, usePlotlyConfig, usePlotlyColors } from '@/lib/utils/plotlyTheme'

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

interface Umap2DScatterPlotProps {
  x: number[]
  y: number[]
}

const Umap2DScatterPlot = React.memo(function Umap2DScatterPlot({ x, y }: Umap2DScatterPlotProps) {
  const [isClient, setIsClient] = useState(false)
  const [plotlyError, setPlotlyError] = useState<string | null>(null)

  const colors = usePlotlyColors()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const plotData = useMemo((): Partial<PlotData>[] => {
    if (!x || !y || x.length === 0) {
      return []
    }

    return [{
      x,
      y,
      mode: 'markers',
      type: 'scattergl',
      marker: {
        size: 4,
        opacity: 0.7,
        color: colors.primary,
      },
      hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<extra></extra>',
    }]
  }, [x, y, colors.primary])

  const baseLayout = usePlotlyLayout({
    showLegend: false
  })

  const layout = useMemo((): Partial<Layout> => ({
    ...baseLayout,
    dragmode: 'pan',
    hovermode: 'closest',
    margin: {
      l: 0,
      r: 0,
      t: 0,
      b: 0,
    },
  }), [baseLayout])

  const baseConfig = usePlotlyConfig()

  const config = useMemo((): Partial<Config> => ({
    ...baseConfig,
    displayModeBar: true,
    scrollZoom: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d', 'toImage', 'select2d', 'lasso2d'] as any,
  }), [baseConfig])

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

  return (
    <div className="w-full h-full min-h-[400px]">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError={(error: any) => {
          console.error('Plotly error:', error)
          setPlotlyError(error.message || 'Unknown plotting error')
        }}
      />
    </div>
  )
})

export default Umap2DScatterPlot
