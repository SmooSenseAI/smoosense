'use client'

import { useBubblePlot } from '@/lib/hooks/useBubblePlot'
import PlotlyBubblePlot from '@/lib/features/bubblePlot/PlotlyBubblePlot'
import BubblePlotControls from '@/lib/features/bubblePlot/BubblePlotControls'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'

export default function BubblePlot() {
  const { data: bubblePlotData, loading, error } = useBubblePlot()

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <BubblePlotControls />
      
      {/* Chart */}
      <div className="flex-1">
        {loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse text-muted-foreground">Loading bubble plot...</div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-destructive">Error loading bubble plot</div>
              <div className="text-xs text-muted-foreground mt-2">{error}</div>
            </div>
          </div>
        ) : bubblePlotData && bubblePlotData.length > 0 ? (
          <PlotlyBubblePlot data={bubblePlotData} />
        ) : (
          <TextPlaceHolder>No bubble plot data available</TextPlaceHolder>
        )}
      </div>
    </div>
  )
}