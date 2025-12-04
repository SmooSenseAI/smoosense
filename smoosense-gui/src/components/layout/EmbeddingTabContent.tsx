'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEmbTab } from '@/lib/features/ui/uiSlice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import ColumnFilters from '@/components/filters/ColumnFilters'
import EmbeddingControls from '@/components/emb/EmbeddingControls'

const embTabs = ['Retrieve', '2D', 'Cluster'] as const

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

      {/* Middle Panel - Embedding visualization with Tab Selection */}
      <div className="h-full flex flex-col">
        {/* Embedding Controls - Column Selection */}
        <EmbeddingControls />

        {/* Embedding Tab Selection */}
        <div className="flex-shrink-0 p-2 border-b border-border bg-background flex justify-center">
          <Tabs
            value={activeEmbTab}
            onValueChange={(value) => dispatch(setActiveEmbTab(value as typeof embTabs[number]))}
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
        <div className="flex-1 bg-muted/20 flex items-center justify-center">
          {activeEmbTab === 'Retrieve' ? (
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium">Retrieve</p>
              <p className="text-sm">Similarity search placeholder</p>
            </div>
          ) : activeEmbTab === '2D' ? (
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium">2D Projection</p>
              <p className="text-sm">UMAP/t-SNE visualization placeholder</p>
            </div>
          ) : activeEmbTab === 'Cluster' ? (
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium">Cluster</p>
              <p className="text-sm">Clustering visualization placeholder</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Panel - Placeholder */}
      <div className="h-full flex flex-col bg-muted/10">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p className="text-lg font-medium">Results Panel</p>
            <p className="text-sm">Results will be displayed here</p>
          </div>
        </div>
      </div>
    </ResizablePanels>
  )
}
