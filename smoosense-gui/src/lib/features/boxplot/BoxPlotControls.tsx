'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import CategoricalColumnDropdown from '@/components/common/CategoricalColumnDropdown'
import MultiSelectColumnDropdown from '@/components/common/MultiSelectColumnDropdown'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setBoxPlotSortBy } from '@/lib/features/ui/uiSlice'

const sortByOptions = [
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'avg', label: 'Average' },
  { value: 'q50', label: 'Median (Q50)' },
  { value: 'std', label: 'Standard Deviation' },
  { value: 'skewness', label: 'Skewness' },
] as const

export default function BoxPlotControls() {
  const dispatch = useAppDispatch()
  const boxPlotSortBy = useAppSelector((state) => state.ui.boxPlotSortBy)

  const handleSortByChange = (value: string) => {
    dispatch(setBoxPlotSortBy(value as 'min' | 'max' | 'avg' | 'q50' | 'std' | 'skewness'))
  }

  return (
    <div className="flex-shrink-0 p-4 border-b bg-background space-y-4">
      {/* First row: Breakdown Column and Sort By */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <CategoricalColumnDropdown
            settingKey="boxPlotBreakdownColumn"
            label="Breakdown Column"
            shouldInitialize={false}
          />
        </div>

        <div className="flex gap-3 items-center w-[300px]">
          <label className="text-sm font-medium text-foreground min-w-[50px]">
            Sort By
          </label>
          <Select
            value={boxPlotSortBy}
            onValueChange={handleSortByChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Second row: Value Columns */}
      <div className="w-full">
        <MultiSelectColumnDropdown
          settingKey="boxPlotColumns"
          label="Value Columns"
          candidateRenderTypes={[RenderType.Number]}
          shouldInitialize={true}
        />
      </div>
    </div>
  )
}