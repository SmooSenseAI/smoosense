'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotColorScale } from '@/lib/features/ui/uiSlice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

// Plotly color scales with their CSS gradient representations
const COLOR_SCALES: Record<string, string> = {
  'Jet': 'linear-gradient(to right, #000080, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000, #800000)',
  'Hot': 'linear-gradient(to right, #000000, #e60000, #ffd200, #ffffff)',
  'Reds': 'linear-gradient(to right, #fff5f0, #fee0d2, #fcbba1, #fc9272, #fb6a4a, #ef3b2c, #cb181d, #a50f15, #67000d)',
  'Picnic': 'linear-gradient(to right, #0000ff, #3399ff, #66ccff, #99ccff, #ccccff, #ffffff, #ffcccc, #ff9999, #ff6666, #ff3333, #ff0000)',
  'Rainbow': 'linear-gradient(to right, #96005a, #0000c8, #0019ff, #0098ff, #2cff96, #97ff00, #ffea00, #ff6f00, #ff0000)',
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

export default function ColorScaleDropdown() {
  const dispatch = useAppDispatch()
  const colorScale = useAppSelector((state) => state.ui.bubblePlotColorScale)

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-foreground">Color Scale</label>
      <div className="flex-1">
        <Select
          value={colorScale}
          onValueChange={(value) => dispatch(setBubblePlotColorScale(value))}
        >
          <SelectTrigger className="w-full">
            <span className="text-sm">{colorScale}</span>
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
  )
}
