'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveEmbTab } from '@/lib/features/ui/uiSlice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import ColumnFilters from '@/components/filters/ColumnFilters'
import Umap2D, { type UmapResult, type UmapSelection } from '@/components/emb/Umap2D'
import GalleryItem from '@/components/gallery/GalleryItem'
import GalleryControls from '@/components/gallery/GalleryControls'
import { useSingleColumnRenderType } from '@/lib/hooks/useRenderType'

const embTabs = ['Retrieve', 'UMAP', 'Cluster'] as const

export default function EmbeddingTabContent() {
  const dispatch = useAppDispatch()
  const activeEmbTab = useAppSelector((state) => state.ui.activeEmbTab)
  const visualColumn = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const captionColumn = useAppSelector((state) => state.ui.columnForGalleryCaption)
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const visualRenderType = useSingleColumnRenderType(visualColumn || '')

  const [umapResult, setUmapResult] = useState<UmapResult | null>(null)
  const [umapSelection, setUmapSelection] = useState<UmapSelection | null>(null)

  const handleResultChange = useCallback((result: UmapResult | null) => {
    setUmapResult(result)
    setUmapSelection(null) // Reset selection when result changes
  }, [])

  const handleSelectionChange = useCallback((selection: UmapSelection | null) => {
    setUmapSelection(selection)
  }, [])

  // Get selected items from UMAP result
  const selectedItems = useMemo(() => {
    if (!umapResult || !umapSelection || umapSelection.indices.length === 0) {
      return []
    }

    const visualValues = visualColumn ? umapResult.columnValues[visualColumn] : undefined
    const captionValues = captionColumn ? umapResult.columnValues[captionColumn] : undefined

    return umapSelection.indices.map(idx => ({
      index: idx,
      visualValue: visualValues?.[idx],
      captionValue: captionValues?.[idx],
    }))
  }, [umapResult, umapSelection, visualColumn, captionColumn])

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
        <div className="flex-1 bg-muted/20">
          {activeEmbTab === 'Retrieve' ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                <p className="text-lg font-medium">Retrieve</p>
                <p className="text-sm">Coming soon</p>
              </div>
            </div>
          ) : activeEmbTab === 'UMAP' ? (
            <Umap2D
              onResultChange={handleResultChange}
              onSelectionChange={handleSelectionChange}
            />
          ) : activeEmbTab === 'Cluster' ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                <p className="text-lg font-medium">Cluster</p>
                <p className="text-sm">Coming soon</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Panel - Gallery for selected items */}
      <div className="h-full flex flex-col bg-muted/10">
        {activeEmbTab === 'UMAP' ? (
          <>
            <GalleryControls showRandom={false} />
            <div className="flex-1 overflow-auto p-2">
              {selectedItems.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    <p className="text-sm">Lasso select points</p>
                    <p className="text-xs mt-1">to view them here</p>
                  </div>
                </div>
              ) : (
                <div
                  className="grid gap-4 justify-items-center"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, ${galleryItemWidth}px)`
                  }}
                >
                  {selectedItems.map((item) => (
                    <GalleryItem
                      key={item.index}
                      row={{}}
                      index={item.index}
                      visualValue={item.visualValue}
                      captionValue={item.captionValue}
                      renderType={visualRenderType}
                      onClick={null}
                    />
                  ))}
                </div>
              )}
            </div>
            {selectedItems.length > 0 && (
              <div className="flex-shrink-0 px-4 py-2 text-xs text-muted-foreground border-t">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium">Results Panel</p>
              <p className="text-sm">Results will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    </ResizablePanels>
  )
}
