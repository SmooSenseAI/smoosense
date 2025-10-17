'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActivePlotTab } from '@/lib/features/ui/uiSlice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import Gallery from '@/components/gallery/Gallery'
import ColumnFilters from '@/components/filters/ColumnFilters'
import HistogramChart from '@/lib/features/histogram/HistogramChart'
import BubblePlot from '@/lib/features/bubblePlot/BubblePlot'
import BalanceMap from '@/lib/features/balanceMap/BalanceMap'
import HeatMap from '@/lib/features/heatmap/HeatMap'
import BoxPlot from '@/lib/features/boxplot/BoxPlot'

const plotTabs = ['BubblePlot', 'BalanceMap', 'HeatMap', 'Histogram', 'BoxPlot']

export default function PlotTabContent() {
  const dispatch = useAppDispatch()
  const activePlotTab = useAppSelector((state) => state.ui.activePlotTab)

  return (
    <ResizablePanels
      direction="horizontal"
      defaultSizes={[10, 45, 45]}
      className="h-full"
    >
      {/* Left Panel - Column Filters */}
      <ColumnFilters />

      {/* Middle Panel - Plot with Tab Selection */}
      <div className="h-full flex flex-col">
        {/* Plot Tab Selection */}
        <div className="flex-shrink-0 p-2 border-b border-border bg-background flex justify-center">
          <Tabs 
            value={activePlotTab} 
            onValueChange={(value) => dispatch(setActivePlotTab(value))}
            className="w-auto"
          >
            <TabsList className="h-8 bg-transparent border border-border/30">
              {plotTabs.map((plotTab) => (
                <TabsTrigger 
                  key={plotTab} 
                  value={plotTab}
                  className={`
                    text-sm h-6 px-3 flex items-center gap-4
                    cursor-pointer
                    data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none
                  `}
                >
                  {plotTab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Plot Component */}
        <div className="flex-1 bg-muted/20">
          {activePlotTab === 'Histogram' ? (
            <HistogramChart />
          ) : activePlotTab === 'BubblePlot' ? (
            <BubblePlot />
          ) : activePlotTab === 'BalanceMap' ? (
            <BalanceMap />
          ) : activePlotTab === 'HeatMap' ? (
            <HeatMap />
          ) : activePlotTab === 'BoxPlot' ? (
            <BoxPlot />
          ) : null}
        </div>
      </div>

      {/* Right Panel - Gallery */}
      <Gallery />
    </ResizablePanels>
  )
}