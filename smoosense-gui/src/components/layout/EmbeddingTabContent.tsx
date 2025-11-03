'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEmbTab } from '@/lib/features/ui/uiSlice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import Gallery from '@/components/gallery/Gallery'
import ColumnFilters from '@/components/filters/ColumnFilters'
import BalanceMap from '@/lib/features/balanceMap/BalanceMap'

const embTabs = ['Search', 'Cluster']

export default function EmbeddingTabContent() {
  const dispatch = useAppDispatch()
  const activeEmbTab = useAppSelector((state) => state.ui.activeEmbTab)

  return (
    <ResizablePanels
      direction="horizontal"
      defaultSizes={[10, 45, 45]}
      className="h-full"
    >
      {/* Left Panel - Column Filters */}
      <ColumnFilters />

      {/* Middle Panel - Embedding with Tab Selection */}
      <div className="h-full flex flex-col">
        {/* Embedding Tab Selection */}
        <div className="flex-shrink-0 p-2 border-b border-border bg-background flex justify-center">
          <Tabs
            value={activeEmbTab}
            onValueChange={(value) => dispatch(setActiveEmbTab(value))}
            className="w-auto"
          >
            <TabsList className="h-8 bg-transparent border border-border/30">
              {embTabs.map((embTab) => (
                <TabsTrigger
                  key={embTab}
                  value={embTab}
                  className={`
                    text-sm h-6 px-3 flex items-center gap-4
                    cursor-pointer
                    data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none
                  `}
                >
                  {embTab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Embedding Component */}
        <div className="flex-1 bg-muted/20">
          {activeEmbTab === 'Search' ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-lg">Search coming soon...</p>
            </div>
          ) : activeEmbTab === 'Cluster' ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-lg">Cluster coming soon...</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Panel - Gallery */}
      <Gallery />
    </ResizablePanels>
  )
}
