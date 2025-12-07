'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import IconPopover from '@/components/common/IconPopover'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotMaxMarkerSize, setBubblePlotOpacity, setBubblePlotMarkerSizeContrastRatio, setBubblePlotColorScale } from '@/lib/features/ui/uiSlice'

// Plotly color scales with their CSS gradient representations
const COLOR_SCALES: Record<string, string> = {
  'Jet': 'linear-gradient(to right, #000080, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000, #800000)',
  'Hot': 'linear-gradient(to right, #000000, #e60000, #ffd200, #ffffff)',
  'Reds': 'linear-gradient(to right, #fff5f0, #fee0d2, #fcbba1, #fc9272, #fb6a4a, #ef3b2c, #cb181d, #a50f15, #67000d)',
  'Picnic': 'linear-gradient(to right, #0000ff, #3399ff, #66ccff, #99ccff, #ccccff, #ffffff, #ffcccc, #ff9999, #ff6666, #ff3333, #ff0000)',
}

function ColorScaleBar({ scale }: { scale: string }) {
  const gradient = COLOR_SCALES[scale] || 'linear-gradient(to right, #ccc, #666)'
  return (
    <div
      className="h-3 w-full rounded-sm"
      style={{ background: gradient }}
    />
  )
}

function BubblePlotMoreControlsContent() {
  const dispatch = useAppDispatch()
  const bubblePlotMaxMarkerSize = useAppSelector((state) => state.ui.bubblePlotMaxMarkerSize)
  const bubblePlotOpacity = useAppSelector((state) => state.ui.bubblePlotOpacity)
  const bubblePlotMarkerSizeContrastRatio = useAppSelector((state) => state.ui.bubblePlotMarkerSizeContrastRatio)
  const bubblePlotColorScale = useAppSelector((state) => state.ui.bubblePlotColorScale)

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

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Color Scale</label>
        <div className="flex-1">
          <Select
            value={bubblePlotColorScale}
            onValueChange={(value) => dispatch(setBubblePlotColorScale(value))}
          >
            <SelectTrigger className="w-full">
              <span className="text-sm">{bubblePlotColorScale}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(COLOR_SCALES).map((scale) => (
                <SelectItem key={scale} value={scale}>
                  <div className="flex items-center gap-2 w-48">
                    <span className="text-sm w-16">{scale}</span>
                    <ColorScaleBar scale={scale} />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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