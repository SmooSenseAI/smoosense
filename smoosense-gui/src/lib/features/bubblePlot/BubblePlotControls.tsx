'use client'

import NumericalColumnDropdown from '@/components/common/NumericalColumnDropdown'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBubblePlotXColumn, setBubblePlotYColumn } from '@/lib/features/ui/uiSlice'
import BubblePlotMoreControls from './BubblePlotMoreControls'

export default function BubblePlotControls() {
  const dispatch = useAppDispatch()
  const bubblePlotXColumn = useAppSelector((state) => state.ui.bubblePlotXColumn)
  const bubblePlotYColumn = useAppSelector((state) => state.ui.bubblePlotYColumn)

  const handleSwapColumns = () => {
    dispatch(setBubblePlotXColumn(bubblePlotYColumn))
    dispatch(setBubblePlotYColumn(bubblePlotXColumn))
  }

  return (
    <div className="flex-shrink-0 p-4 border-b bg-background">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <NumericalColumnDropdown
            settingKey="bubblePlotXColumn"
            label="X Column"
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
          <NumericalColumnDropdown
            settingKey="bubblePlotYColumn"
            label="Y Column"
          />
        </div>

        <div className="flex-1">
          <CategoricalColumnDropdown
            settingKey="bubblePlotBreakdownColumn"
            label="Breakdown Column"
          />
        </div>

        <div className="flex-none">
          <BubblePlotMoreControls />
        </div>
      </div>
    </div>
  )
}