'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setUmapNNeighbors, setUmapMinDist } from '@/lib/features/ui/uiSlice'
import { Slider } from '@/components/ui/slider'
import EmbeddingColumnDropdown from '@/components/settings/EmbeddingColumnDropdown'

export default function Umap2DControls() {
  const dispatch = useAppDispatch()
  const nNeighbors = useAppSelector((state) => state.ui.umapNNeighbors)
  const minDist = useAppSelector((state) => state.ui.umapMinDist)

  return (
    <div className="flex gap-6 items-center">
      <EmbeddingColumnDropdown />

      <div className="flex flex-col gap-1 flex-1 min-w-24 max-w-48">
        <label className="text-sm font-medium text-foreground">
          n_neighbors: {nNeighbors}
        </label>
        <Slider
          min={2}
          max={100}
          step={1}
          value={[nNeighbors]}
          onValueChange={(value) => dispatch(setUmapNNeighbors(value[0]))}
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-24 max-w-48">
        <label className="text-sm font-medium text-foreground">
          min_dist: {minDist.toFixed(2)}
        </label>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[minDist]}
          onValueChange={(value) => dispatch(setUmapMinDist(value[0]))}
        />
      </div>
    </div>
  )
}
