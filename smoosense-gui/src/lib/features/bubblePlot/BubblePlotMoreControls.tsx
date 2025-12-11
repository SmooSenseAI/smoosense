'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import IconPopover from '@/components/common/IconPopover'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'
import ColorScaleDropdown from '@/components/settings/ColorScaleDropdown'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotMaxMarkerSize, setBubblePlotMinMarkerSize, setBubblePlotOpacity, setBubblePlotMarkerSizeContrastRatio } from '@/lib/features/ui/uiSlice'

// Special value for coloring by bubble size (count)
export const BUBBLE_SIZE_COLOR_VALUE = '__bubble_size__'

const BUBBLE_SIZE_EXTRA_OPTIONS = [
  { value: BUBBLE_SIZE_COLOR_VALUE, label: 'Bubble Size' }
]

function BubblePlotMoreControlsContent() {
  const dispatch = useAppDispatch()
  const bubblePlotMaxMarkerSize = useAppSelector((state) => state.ui.bubblePlotMaxMarkerSize)
  const bubblePlotMinMarkerSize = useAppSelector((state) => state.ui.bubblePlotMinMarkerSize)
  const bubblePlotOpacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const bubblePlotMarkerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)

  return (
    <div className="space-y-4 w-full max-w-sm">
      <CategoricalColumnDropdown
        settingKey="bubblePlotBreakdownColumn"
        label="Breakdown"
      />

      <NumericalColumnDropdown
        settingKey="bubblePlotColorColumn"
        label="Color by"
        shouldInitialize={false}
        extraOptions={BUBBLE_SIZE_EXTRA_OPTIONS}
      />

      <ColorScaleDropdown />

      <div>
        <label className="text-sm font-medium mb-2 block">
          Min Marker Size: {bubblePlotMinMarkerSize}
        </label>
        <Slider
          value={[bubblePlotMinMarkerSize]}
          onValueChange={(value) => dispatch(setBubblePlotMinMarkerSize(value[0]))}
          max={15}
          min={2}
          step={1}
          className="w-full"
        />
      </div>

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
      contentClassName="p-4 w-96"
      side="right"
      align="start"
    >
      <BubblePlotMoreControlsContent />
    </IconPopover>
  )
}