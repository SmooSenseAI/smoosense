'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setUmapNNeighbors, setUmapMinDist } from '@/lib/features/ui/uiSlice'
import LabeledSlider from '@/components/ui/LabeledSlider'
import EmbeddingColumnDropdown from '@/components/settings/EmbeddingColumnDropdown'
import Umap2DMoreControls from './Umap2DMoreControls'

const NNeighborsHelp = (
  <div className="space-y-2">
    <p className="font-medium">n_neighbors</p>
    <p className="text-muted-foreground">
      Controls how UMAP balances local vs global structure.
    </p>
    <ul className="list-disc list-inside text-muted-foreground space-y-1">
      <li><strong>Low values (2-15):</strong> Focus on local structure, tight clusters</li>
      <li><strong>High values (50-100):</strong> Preserve more global structure, spread out</li>
    </ul>
  </div>
)

const MinDistHelp = (
  <div className="space-y-2">
    <p className="font-medium">min_dist</p>
    <p className="text-muted-foreground">
      Controls how tightly points are packed together.
    </p>
    <ul className="list-disc list-inside text-muted-foreground space-y-1">
      <li><strong>Low values (0-0.1):</strong> Points clump tightly, dense clusters</li>
      <li><strong>High values (0.5-1):</strong> Points spread out, looser structure</li>
    </ul>
  </div>
)

export default function Umap2DControls() {
  const dispatch = useAppDispatch()
  const nNeighbors = useAppSelector((state) => state.ui.umapNNeighbors)
  const minDist = useAppSelector((state) => state.ui.umapMinDist)

  return (
    <div className="flex gap-6 items-stretch">
      <EmbeddingColumnDropdown />

      <LabeledSlider
        label="n_neighbors"
        value={nNeighbors}
        onValueChange={(value) => dispatch(setUmapNNeighbors(value))}
        min={2}
        max={100}
        step={1}
        hoverComponent={NNeighborsHelp}
      />

      <LabeledSlider
        label="min_dist"
        value={minDist}
        onValueChange={(value) => dispatch(setUmapMinDist(value))}
        min={0}
        max={1}
        step={0.01}
        formatValue={(v) => v.toFixed(2)}
        hoverComponent={MinDistHelp}
      />

      <Umap2DMoreControls />
    </div>
  )
}
