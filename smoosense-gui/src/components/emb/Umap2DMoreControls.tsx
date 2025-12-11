'use client'

import { Slider } from '@/components/ui/slider'
import IconPopover from '@/components/common/IconPopover'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'
import ColorScaleDropdown from '@/components/settings/ColorScaleDropdown'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotMinMarkerSize, setBubblePlotOpacity } from '@/lib/features/ui/uiSlice'
import { Menu } from 'lucide-react'

function Umap2DMoreControlsContent() {
  const dispatch = useAppDispatch()
  const opacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const markerSize = useAppSelector((state) => state.ui.bubblePlotMinMarkerSize)

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
      />

      <ColorScaleDropdown />

      <div>
        <label className="text-sm font-medium mb-2 block">
          Marker Size: {markerSize}
        </label>
        <Slider
          value={[markerSize]}
          onValueChange={(value) => dispatch(setBubblePlotMinMarkerSize(value[0]))}
          max={15}
          min={2}
          step={1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Opacity: {(opacity * 100).toFixed(0)}%
        </label>
        <Slider
          value={[opacity]}
          onValueChange={(value) => dispatch(setBubblePlotOpacity(value[0]))}
          max={1}
          min={0.1}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default function Umap2DMoreControls() {
  return (
    <IconPopover
      icon={<Menu />}
      tooltip="More Controls"
      contentClassName="p-4 w-96"
      side="right"
      align="start"
    >
      <Umap2DMoreControlsContent />
    </IconPopover>
  )
}
