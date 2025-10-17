'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useRenderType } from '@/lib/hooks'
import { useProcessedRowData } from '@/lib/hooks/useProcessedRowData'
import { setJustClickedRowId } from '@/lib/features/viewing/viewingSlice'
import { handPickRow } from '@/lib/features/handPickedRows/handPickedRowsSlice'
import { isVisualType } from '@/lib/utils/renderTypeUtils'
import { toast } from 'sonner'
import GalleryControls from './GalleryControls'
import GalleryItem from './GalleryItem'

export default function Gallery() {
  const dispatch = useAppDispatch()
  const { data: rowData } = useProcessedRowData()
  const renderTypeColumns = useRenderType()
  const columnForGalleryVisual = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const columnForGalleryCaption = useAppSelector((state) => state.ui.columnForGalleryCaption)
  const galleryItemWidth = useAppSelector((state) => state.ui.galleryItemWidth)
  const galleryItemHeight = useAppSelector((state) => state.ui.galleryItemHeight)

  if (!rowData || rowData.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <GalleryControls rowData={[]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No data available</p>
            <p className="text-sm">Load data to view gallery</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if there are visual columns after we have data
  const hasVisualColumns = renderTypeColumns && Object.entries(renderTypeColumns).some(([, renderType]) =>
    isVisualType(renderType)
  )

  if (!hasVisualColumns) {
    return (
      <div className="h-full flex flex-col">
        <GalleryControls rowData={rowData} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No visual columns found</p>
            <p className="text-sm">Gallery requires columns with ImageUrl, VideoUrl, IFrame, or ImageMask render types</p>
          </div>
        </div>
      </div>
    )
  }

  const renderGalleryItem = (row: Record<string, unknown>, index: number) => {
    const visualValue = row[columnForGalleryVisual]
    const captionValue = row[columnForGalleryCaption]
    const renderType = renderTypeColumns[columnForGalleryVisual]

    const handleClick = (event: React.MouseEvent) => {
      dispatch(setJustClickedRowId(String(index)))

      // Check if Ctrl key (or Cmd on Mac) is pressed
      if (event.ctrlKey || event.metaKey) {
        dispatch(handPickRow(row))
        toast.success(`Row ${index} has been hand-picked`)
      }
    }

    return (
      <GalleryItem
        key={`${index}-${galleryItemWidth}-${galleryItemHeight}`}
        row={row}
        index={index}
        visualValue={visualValue}
        captionValue={captionValue}
        renderType={renderType}
        onClick={handleClick}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <GalleryControls rowData={rowData} />

      {/* Gallery Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="grid gap-4 justify-items-center"
          style={{
            gridTemplateColumns: `repeat(auto-fill, ${galleryItemWidth}px)`
          }}
        >
          {rowData.map((row, index) => renderGalleryItem(row, index))}
        </div>
      </div>
    </div>
  )
}