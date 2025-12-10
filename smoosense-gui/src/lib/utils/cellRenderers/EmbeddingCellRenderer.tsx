'use client'

import { memo, useState, useEffect } from 'react'
import _ from 'lodash'
import { ChevronsLeftRightEllipsis } from 'lucide-react'
import CellPopover from '@/components/ui/CellPopover'
import { useAppSelector } from '@/lib/hooks'
import { lanceVectorSearch, type VectorSearchResult } from '@/lib/api/lance'
import { useSingleColumnRenderType } from '@/lib/hooks/useRenderType'
import GalleryItem from '@/components/gallery/GalleryItem'
import GalleryControls from '@/components/gallery/GalleryControls'

interface EmbeddingCellRendererProps {
  value: unknown
  embDim?: number | null
  columnName?: string
}

interface SimilarRowsGalleryProps {
  embedding: number[]
  columnName: string
  embDim: number
}

function SimilarRowsGallery({ embedding, columnName }: SimilarRowsGalleryProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const visualColumn = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const captionColumn = useAppSelector((state) => state.ui.columnForGalleryCaption)
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const visualRenderType = useSingleColumnRenderType(visualColumn || '')

  const [rows, setRows] = useState<VectorSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tablePath || _.isEmpty(embedding) || !visualColumn) {
      setLoading(false)
      return
    }

    const fetchSimilarRows = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build select columns: visual column and optionally caption column
        const selectColumns = [visualColumn]
        if (captionColumn && captionColumn !== visualColumn) {
          selectColumns.push(captionColumn)
        }

        const result = await lanceVectorSearch({
          tablePath,
          embedding,
          vectorColumn: columnName,
          selectColumns,
          limit: 12,
        })

        setRows(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch similar rows')
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarRows()
  }, [tablePath, columnName, embedding, visualColumn, captionColumn])

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Finding similar items...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <GalleryControls showRandom={false} />
      <div className="px-2 py-1 text-xs text-muted-foreground">
        Cosine distance (0 = identical, 1 = orthogonal, 2 = opposite; may have small error due to indexing)
      </div>
      <div className="flex-1 overflow-auto p-2">
        {_.isEmpty(rows) ? (
          <div className="p-4 text-sm text-muted-foreground">
            No similar items found
          </div>
        ) : (
          <div
            className="grid gap-4 justify-items-center"
            style={{
              gridTemplateColumns: `repeat(auto-fill, ${galleryItemWidth}px)`
            }}
          >
            {rows.map((row, index) => {
              const visualValue = row[visualColumn]
              const captionValue = captionColumn ? row[captionColumn] : null
              const distance = row._distance as number

              return (
                <div key={index} className="relative">
                  <div className="absolute top-1 left-1 z-10 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {distance.toFixed(3)}
                  </div>
                  <GalleryItem
                    row={row}
                    index={index}
                    visualValue={visualValue}
                    captionValue={captionValue}
                    renderType={visualRenderType}
                    onClick={null}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const EmbeddingCellRenderer = memo(function EmbeddingCellRenderer({
  value,
  embDim,
  columnName
}: EmbeddingCellRendererProps) {
  // Get dimension from prop or try to infer from array length
  const dimension = embDim ?? (_.isArray(value) ? value.length : null)
  const embedding = _.isArray(value) ? value as number[] : null

  const cellContent = (
    <div className="w-full h-full flex items-center gap-1.5 px-2 text-muted-foreground">
      <ChevronsLeftRightEllipsis className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm">
        {dimension !== null ? `${dimension} embedding` : 'embedding'}
      </span>
    </div>
  )

  // Don't show popover if no embedding data or column name
  if (!embedding || !columnName || !dimension) {
    return cellContent
  }

  const popoverContent = (
    <SimilarRowsGallery
      embedding={embedding}
      columnName={columnName}
      embDim={dimension}
    />
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      title={`Similarity search by ${columnName}`}
      popoverClassName="w-[650px] h-[500px]"
      cellContentClassName="items-center"
    />
  )
})

export default EmbeddingCellRenderer
