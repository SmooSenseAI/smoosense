'use client'

import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setHeatmapXColumn, setHeatmapYColumn } from '@/lib/features/ui/uiSlice'

export default function HeatMapControls() {
  const dispatch = useAppDispatch()
  const heatmapXColumn = useAppSelector((state) => state.ui.heatmapXColumn)
  const heatmapYColumn = useAppSelector((state) => state.ui.heatmapYColumn)

  const handleSwapColumns = () => {
    dispatch(setHeatmapXColumn(heatmapYColumn))
    dispatch(setHeatmapYColumn(heatmapXColumn))
  }

  return (
    <div className="flex-shrink-0 p-4 border-b bg-background space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <CategoricalColumnDropdown
            settingKey="heatmapXColumn" 
            label="X Column"
            shouldInitialize={true}
          />
        </div>

        <div className="flex-none">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapColumns}
            className="h-8 w-8"
            title="Swap X and Y columns"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1">
          <CategoricalColumnDropdown
            settingKey="heatmapYColumn"
            label="Y Column" 
            shouldInitialize={true}
          />
        </div>
      </div>
    </div>
  )
}