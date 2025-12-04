'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import _ from 'lodash'
import { useAppSelector } from '@/lib/hooks'
import Umap2DControls from './Umap2DControls'
import Umap2DScatterPlot from './Umap2DScatterPlot'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'

interface UmapResult {
  x: number[]
  y: number[]
  count: number
  runtime: number
  params: {
    nNeighbors: number
    minDist: number
  }
}

export default function Umap2D() {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const embColumn = useAppSelector((state) => state.ui.embColumn)
  const nNeighbors = useAppSelector((state) => state.ui.umapNNeighbors)
  const minDist = useAppSelector((state) => state.ui.umapMinDist)

  const [result, setResult] = useState<UmapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computeUmap = useCallback(async (
    tablePath: string,
    embColumn: string,
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
          nNeighbors,
          minDist,
          queryEngine,
        }),
      })

      const data = await response.json()

      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to compute UMAP')
      }

      setResult({
        x: data.x,
        y: data.y,
        count: data.count,
        runtime: data.runtime,
        params: data.params,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute UMAP')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced version of computeUmap
  const debouncedComputeUmap = useMemo(
    () => _.debounce(computeUmap, 500),
    [computeUmap]
  )

  // Auto-compute when parameters change
  useEffect(() => {
    if (!tablePath || !embColumn) {
      return
    }

    debouncedComputeUmap(tablePath, embColumn, nNeighbors, minDist, queryEngine)

    // Cleanup debounce on unmount
    return () => {
      debouncedComputeUmap.cancel()
    }
  }, [tablePath, embColumn, nNeighbors, minDist, queryEngine, debouncedComputeUmap])

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
            <Umap2DScatterPlot x={result.x} y={result.y} />
            <div className="flex-shrink-0 px-4 py-2 text-xs text-muted-foreground border-t">
              {result.count} points | n_neighbors={result.params.nNeighbors} | min_dist={result.params.minDist} | {result.runtime.toFixed(2)}s
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
