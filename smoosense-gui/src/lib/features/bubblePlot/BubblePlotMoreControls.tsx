'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import IconPopover from '@/components/common/IconPopover'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'
import ColorScaleDropdown from '@/components/settings/ColorScaleDropdown'
import UISettingToggle from '@/components/ui/UISettingToggle'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotMaxMarkerSize, setBubblePlotMinMarkerSize, setBubblePlotOpacity, setBubblePlotMarkerSizeContrastRatio, setBubblePlotBreakdownColumn, setBubblePlotColorColumn } from '@/lib/features/ui/uiSlice'
import { useCallback } from 'react'
import { toast } from 'sonner'

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
  const currentColorColumn = useAppSelector((state) => state.ui.bubblePlotColorColumn)
  const currentBreakdownColumn = useAppSelector((state) => state.ui.bubblePlotBreakdownColumn)

  // When breakdown is set to non-null, clear color by (if it was set)
  const handleBreakdownChange = useCallback((newValue: string | null) => {
    if (newValue !== null && currentColorColumn !== '') {
      dispatch(setBubblePlotColorColumn(''))
      toast.info('"Color by" cleared because "breakdown" was set')
    }
  }, [dispatch, currentColorColumn])

  // When color by is set to non-null, clear breakdown (if it was set)
  const handleColorByChange = useCallback((newValue: string) => {
    if (newValue !== '' && currentBreakdownColumn !== null) {
      dispatch(setBubblePlotBreakdownColumn(null))
      toast.info('"Breakdown" cleared because "color by" was set')
    }
  }, [dispatch, currentBreakdownColumn])

  return (
    <div className="space-y-4 w-full max-w-sm">
      <CategoricalColumnDropdown
        settingKey="bubblePlotBreakdownColumn"
        label="Breakdown"
        postChange={handleBreakdownChange}
      />

      <NumericalColumnDropdown
        settingKey="bubblePlotColorColumn"
        label="Color by"
        shouldInitialize={false}
        extraOptions={BUBBLE_SIZE_EXTRA_OPTIONS}
        postChange={handleColorByChange}
      />

      <ColorScaleDropdown />

      <UISettingToggle settingKey="bubblePlotLogScaleX" label="Use log-scale for X-axis" />
      <UISettingToggle settingKey="bubblePlotLogScaleY" label="Use log-scale for Y-axis"/>

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