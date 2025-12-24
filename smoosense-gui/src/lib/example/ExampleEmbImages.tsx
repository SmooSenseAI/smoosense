'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAppSelector } from '@/lib/hooks'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import Umap2DScatterPlot from '@/components/emb/Umap2DScatterPlot'
import GalleryItem from '@/components/gallery/GalleryItem'
import { RenderType } from '@/lib/utils/agGridCellRenderers'

// Data URL for image embeddings
const DATA_URL = 'https://cdn.smoosense.ai/demo/photos/umap.jsonl'

// Base URL for images
const IMAGES_BASE_URL = 'https://cdn.smoosense.ai/demo/photos'

interface ImageDataItem {
  image_path: string
  x: number
  y: number
  cluster_id: number
}

interface UmapData {
  x: number[]
  y: number[]
  imagePaths: string[]
  clusterIds: number[]
}

// Convert image_path to full URL
function imagePathToUrl(imagePath: string): string {
  // Remove leading "./" prefix if present, then add base URL
  const cleanPath = imagePath.replace(/^\.\//, '')
  return `${IMAGES_BASE_URL}/${cleanPath}`
}

// Parse JSONL data
async function loadData(): Promise<UmapData> {
  const response = await fetch(DATA_URL)
  const text = await response.text()
  const lines = text.trim().split('\n')
  const items: ImageDataItem[] = lines.map(line => JSON.parse(line))

  return {
    x: items.map(item => item.x),
    y: items.map(item => item.y),
    imagePaths: items.map(item => item.image_path),
    clusterIds: items.map(item => item.cluster_id)
  }
}

interface SelectedItem {
  index: number
  imagePath: string
  imageUrl: string
  clusterId: number
}


export default function ExampleEmbImages() {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [umapData, setUmapData] = useState<UmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)

  // Load data on mount
  useEffect(() => {
    loadData()
      .then(data => {
        setUmapData(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load data')
        setIsLoading(false)
      })
  }, [])

  const handleSelectionChange = useCallback((indices: number[]) => {
    setSelectedIndices(indices)
  }, [])

  // Get selected items for gallery
  const selectedItems: SelectedItem[] = useMemo(() => {
    if (!umapData) return []
    return selectedIndices.map(idx => ({
      index: idx,
      imagePath: umapData.imagePaths[idx],
      imageUrl: imagePathToUrl(umapData.imagePaths[idx]),
      clusterId: umapData.clusterIds[idx]
    }))
  }, [selectedIndices, umapData])

  // Prepare visual values (image URLs) for hover tooltip
  const visualValues = useMemo(() => {
    if (!umapData) return []
    return umapData.imagePaths.map(imagePathToUrl)
  }, [umapData])

  // Prepare color values from cluster IDs
  const colorValues = useMemo(() => {
    if (!umapData) return []
    return umapData.clusterIds
  }, [umapData])

  // Prepare caption values for hover tooltip
  const captionValues = useMemo(() => {
    if (!umapData) return []
    return umapData.clusterIds.map(id => `cluster ${id}`)
  }, [umapData])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading image data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!umapData) {
    return null
  }

  return (
    <div className="h-full w-full">
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[60, 40]}
        minSize={20}
        maxSize={80}
      >
        {/* Left: Scatter Plot */}
        <div className="h-full bg-background flex flex-col">
          <div className="flex-1 min-h-0">
            <Umap2DScatterPlot
              x={umapData.x}
              y={umapData.y}
              visualValues={visualValues}
              captionValues={captionValues}
              colorValues={colorValues}
              visualRenderType={RenderType.ImageUrl}
              onSelectionChange={handleSelectionChange}
            />
          </div>
          <div className="flex-shrink-0 px-4 py-2 border-t text-xs text-muted-foreground">
            {umapData.x.length} points, colored by cluster_id
          </div>
        </div>

        {/* Right: Gallery */}
        <div className="h-full flex flex-col bg-muted/10 border-l">
          <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
            <h3 className="font-medium">Selected Images</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedItems.length === 0
                ? 'Lasso select points to view images'
                : `${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} selected`}
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground text-center">
                  <p className="text-sm">Lasso select points</p>
                  <p className="text-xs mt-1">to view images here</p>
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
                    visualValue={item.imageUrl}
                    captionValue={`cluster ${item.clusterId}`}
                    renderType={RenderType.ImageUrl}
                    onClick={null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ResizablePanels>
    </div>
  )
}
