'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import _ from 'lodash'
import { useAppSelector } from '@/lib/hooks'
import { useSingleColumnRenderType } from '@/lib/hooks/useRenderType'
import Umap2DControls from './Umap2DControls'
import Umap2DScatterPlot from './Umap2DScatterPlot'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'

export interface UmapResult {
  x: number[]
  y: number[]
  columnValues: Record<string, unknown[]>
  count: number
  runtime: number
  params: {
    nNeighbors: number
    minDist: number
  }
}

export interface UmapSelection {
  indices: number[]
  type: 'click' | 'lasso'
}

interface Umap2DProps {
  onResultChange?: (result: UmapResult | null) => void
  onSelectionChange?: (selection: UmapSelection | null) => void
}

export default function Umap2D({ onResultChange, onSelectionChange }: Umap2DProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const embColumn = useAppSelector((state) => state.ui.embColumn)
  const visualColumn = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const captionColumn = useAppSelector((state) => state.ui.columnForGalleryCaption)
  const breakdownColumn = useAppSelector((state) => state.ui.bubblePlotBreakdownColumn)
  const colorColumn = useAppSelector((state) => state.ui.bubblePlotColorColumn)
  const nNeighbors = useAppSelector((state) => state.ui.umapNNeighbors)
  const minDist = useAppSelector((state) => state.ui.umapMinDist)
  const visualRenderType = useSingleColumnRenderType(visualColumn || '')

  const [result, setResult] = useState<UmapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computeUmap = useCallback(async (
    tablePath: string,
    embColumn: string,
    extraColumns: string[],
    nNeighbors: number,
    minDist: number,
    queryEngine: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/umap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tablePath,
          embColumn,
          extraColumns,
          nNeighbors,
          minDist,
          queryEngine,
        }),
      })

      const data = await response.json()

      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to compute UMAP')
      }

      const newResult: UmapResult = {
        x: data.x,
        y: data.y,
        columnValues: data.columnValues || {},
        count: data.count,
        runtime: data.runtime,
        params: data.params,
      }
      setResult(newResult)
      onResultChange?.(newResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute UMAP')
      onResultChange?.(null)
    } finally {
      setLoading(false)
    }
  }, [onResultChange])

  // Debounced version of computeUmap
  const debouncedComputeUmap = useMemo(
    () => _.debounce(computeUmap, 500),
    [computeUmap]
  )

  // Build extra columns list
  const extraColumns = useMemo(() => {
    const cols: string[] = []
    if (visualColumn) cols.push(visualColumn)
    if (captionColumn && captionColumn !== visualColumn) cols.push(captionColumn)
    if (breakdownColumn && !cols.includes(breakdownColumn)) cols.push(breakdownColumn)
    if (colorColumn && !cols.includes(colorColumn)) cols.push(colorColumn)
    return cols
  }, [visualColumn, captionColumn, breakdownColumn, colorColumn])

  // Auto-compute when parameters change
  useEffect(() => {
    if (!tablePath || !embColumn) {
      return
    }

    debouncedComputeUmap(tablePath, embColumn, extraColumns, nNeighbors, minDist, queryEngine)

    // Cleanup debounce on unmount
    return () => {
      debouncedComputeUmap.cancel()
    }
  }, [tablePath, embColumn, extraColumns, nNeighbors, minDist, queryEngine, debouncedComputeUmap])

  const handleSelectionChange = useCallback((indices: number[], type: 'click' | 'lasso') => {
    if (indices.length === 0) {
      onSelectionChange?.(null)
    } else {
      onSelectionChange?.({ indices, type })
    }
  }, [onSelectionChange])

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <Umap2DControls />
      </div>

      {/* Chart */}
      <div className="flex-1">
        {!embColumn ? (
          <TextPlaceHolder>
            Select an embedding column to visualize
          </TextPlaceHolder>
        ) : loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-muted-foreground">Computing UMAP projection...</div>
              <div className="text-xs text-muted-foreground mt-1">This may take a moment</div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-destructive">Error computing UMAP</div>
              <div className="text-xs text-muted-foreground mt-2">{error}</div>
            </div>
          </div>
        ) : result ? (
          <div className="h-full flex flex-col">
            <Umap2DScatterPlot
              x={result.x}
              y={result.y}
              visualValues={visualColumn ? result.columnValues[visualColumn] : undefined}
              captionValues={captionColumn ? result.columnValues[captionColumn] : undefined}
              breakdownValues={breakdownColumn ? result.columnValues[breakdownColumn] : undefined}
              colorValues={colorColumn ? result.columnValues[colorColumn] as number[] : undefined}
              visualRenderType={visualRenderType}
              onSelectionChange={handleSelectionChange}
            />
            <div className="flex-shrink-0 px-4 py-2 text-xs text-muted-foreground border-t">
              {result.count} points | n_neighbors={result.params?.nNeighbors ?? nNeighbors} | min_dist={result.params?.minDist ?? minDist} | {result.runtime.toFixed(2)}s
            </div>
          </div>
        ) : (
          <TextPlaceHolder>
            Click &quot;Compute UMAP&quot; to generate 2D projection
          </TextPlaceHolder>
        )}
      </div>
    </div>
  )
}
