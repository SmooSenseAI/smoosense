'use client'

import dynamic from 'next/dynamic'
import { useHistogram } from '@/lib/hooks/useHistogram'
import HistogramControl from './HistogramControl'

// Dynamically import PlotlyHistogramPlot to avoid SSR issues
const PlotlyHistogramPlot = dynamic(() => import('./PlotlyHistogramPlot'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-background text-muted-foreground">
      <div className="text-center">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    </div>
  )
})

export default function HistogramChart() {
  const { data: histogramData } = useHistogram()

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <HistogramControl />

      {/* Chart */}
      <div className="flex-1">
        <PlotlyHistogramPlot data={histogramData || []} />
      </div>
    </div>
  )
}