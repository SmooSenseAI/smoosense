'use client'

import { useSingleColumnRenderType, useIsCategorical } from '@/lib/hooks'
import { FilterType } from '@/lib/features/filters/types'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import TextFilterCard from './TextFilterCard'
import EnumFilterCard from './enum/EnumFilterCard'
import RangeFilterCard from './range/RangeFilterCard'
import SettingsShortcutSection from '@/components/settings/SettingsShortcutSection'

interface ColumnFilterCardProps {
  columnName: string
  onClose?: () => void
}

export default function ColumnFilterCard({
  columnName,
  onClose
}: ColumnFilterCardProps) {
  const renderType = useSingleColumnRenderType(columnName)
  const { isCategorical } = useIsCategorical(columnName)

  // Simplified filter determination logic
  const getFilterType = (): FilterType => {
    // isCategorical -> EnumFilterCard
    if (isCategorical === true) {
      return FilterType.ENUM
    }
    
    // Text -> TextFilterCard
    if (renderType === RenderType.Text) {
      return FilterType.TEXT
    }
    
    // Number -> RangeFilterCard
    if (renderType === RenderType.Number) {
      return FilterType.RANGE
    }
    
    // No stats for others
    return FilterType.NONE
  }

  const filterType = getFilterType()

  // Render specific filter card based on type
  switch (filterType) {
    case FilterType.TEXT:
      return <TextFilterCard columnName={columnName} onClose={onClose} />
      
    case FilterType.ENUM:
      return <EnumFilterCard columnName={columnName} onClose={onClose} />
      
    case FilterType.RANGE:
      return <RangeFilterCard columnName={columnName} onClose={onClose} />
      
    case FilterType.NONE:
      return (
        <div>
          <div className="p-4">
            <div className="text-sm text-muted-foreground">No filtering support for this column type</div>
          </div>
          <div className="border-t p-4">
            <SettingsShortcutSection columnName={columnName} />
          </div>
        </div>
      )
      
    default:
      return null
  }
}