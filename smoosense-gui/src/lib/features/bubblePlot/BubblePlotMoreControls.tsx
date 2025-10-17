'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import IconPopover from '@/components/common/IconPopover'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotMaxMarkerSize, setBubblePlotOpacity, setBubblePlotMarkerSizeContrastRatio } from '@/lib/features/ui/uiSlice'

function BubblePlotMoreControlsContent() {
  const dispatch = useAppDispatch()
  const bubblePlotMaxMarkerSize = useAppSelector((state) => state.ui.bubblePlotMaxMarkerSize)
  const bubblePlotOpacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const bubblePlotMarkerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Max Marker Size: {bubblePlotMaxMarkerSize}
        </label>
        <Slider
          value={[bubblePlotMaxMarkerSize]}
          onValueChange={(value) => dispatch(setBubblePlotMaxMarkerSize(value[0]))}
          max={50}
          min={5}
          step={1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Opacity: {(bubblePlotOpacity * 100).toFixed(0)}%
        </label>
        <Slider
          value={[bubblePlotOpacity]}
          onValueChange={(value) => dispatch(setBubblePlotOpacity(value[0]))}
          max={1}
          min={0.1}
          step={0.1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Marker Size Contrast Ratio: {bubblePlotMarkerSizeContrastRatio.toFixed(1)}
        </label>
        <Slider
          value={[bubblePlotMarkerSizeContrastRatio]}
          onValueChange={(value) => dispatch(setBubblePlotMarkerSizeContrastRatio(value[0]))}
          max={7}
          min={-7}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default function BubblePlotMoreControls() {
  return (
    <IconPopover
      icon={<SlidersHorizontal />}
      tooltip="More Controls"
      contentClassName="p-4"
      align="end"
    >
      <BubblePlotMoreControlsContent />
    </IconPopover>
  )
}