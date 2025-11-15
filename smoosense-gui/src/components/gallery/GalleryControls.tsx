'use client'

import {RenderType} from '@/lib/utils/agGridCellRenderers'
import ColumnDropdown from '@/components/common/ColumnDropdown'
import ButtonRandomSamples from '@/components/common/ButtonRandomSamples'
import GalleryMoreControls from './GalleryMoreControls'
import {useAppDispatch, useAppSelector} from '@/lib/hooks'
import {useSingleColumnRenderType} from '@/lib/hooks/useRenderType'
import {setAutoPlayAllVideos} from '@/lib/features/ui/uiSlice'
import {Button} from '@/components/ui/button'
import {Play, Square} from 'lucide-react'

interface GalleryControlsProps {
  rowData: Record<string, unknown>[]
}

export default function GalleryControls({ }: GalleryControlsProps) {
  const dispatch = useAppDispatch()
  const columnForGalleryVisual = useAppSelector((state) => state.ui.columnForGalleryVisual)
  const autoPlayAllVideos = useAppSelector((state) => state.ui.autoPlayAllVideos)

  // Check if visual column's render type is VideoUrl
  const visualColumnRenderType = useSingleColumnRenderType(columnForGalleryVisual || '')
  const isVideoColumn = columnForGalleryVisual && visualColumnRenderType === RenderType.VideoUrl

  const handleToggleAutoPlay = () => {
    dispatch(setAutoPlayAllVideos(!autoPlayAllVideos))
  }

  return (
    <div className="flex-shrink-0 p-4 border-b bg-background">
      <div className="flex gap-4 items-center">
        <ColumnDropdown
          settingKey="columnForGalleryVisual"
          label="Visual Column"
          candidateRenderTypes={[
              RenderType.IFrame, RenderType.ImageUrl, RenderType.VideoUrl, RenderType.ImageMask,
              RenderType.Bbox, RenderType.AudioUrl
          ]}
        />

        <ColumnDropdown
          settingKey="columnForGalleryCaption"
          label="Caption Column"
          candidateRenderTypes={[RenderType.Text, RenderType.Number, RenderType.WordScores]}
        />

        <ButtonRandomSamples />

        {isVideoColumn && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAutoPlay}
            className="flex items-center gap-2"
          >
            {autoPlayAllVideos ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Play
              </>
            )}
          </Button>
        )}

        <div className="ml-auto">
          <GalleryMoreControls />
        </div>
      </div>
    </div>
  )
}