'use client'

import React from 'react'
import { useBalanceMap } from './useBalanceMap'
import PlotlyBalanceMap from './PlotlyBalanceMap'
import BubblePlotControls from '@/lib/features/bubblePlot/BubblePlotControls'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'

export default function BalanceMap() {
  const { data, loading, error } = useBalanceMap()

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <BubblePlotControls />

      {/* Chart */}
      <div className="flex-1">
        {loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse text-muted-foreground">Loading balance map...</div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-destructive">Error loading balance map</div>
              <div className="text-xs text-muted-foreground mt-2">{error}</div>
            </div>
          </div>
        ) : data && data.length > 0 ? (
          <PlotlyBalanceMap data={data} />
        ) : (
          <TextPlaceHolder>No balance map data available</TextPlaceHolder>
        )}
      </div>
    </div>
  )
}