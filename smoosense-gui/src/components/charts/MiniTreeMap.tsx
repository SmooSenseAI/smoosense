'use client'

import { Treemap, ResponsiveContainer } from 'recharts'
import { TreeMapCustomizedContent } from './TreeMapContent'
import TextPlaceHolder from '../common/TextPlaceHolder'
import type { CategoricalCntValue } from '@/lib/features/colStats/types'

interface MiniTreeMapProps {
  data: CategoricalCntValue[]
  isActive?: boolean
}

export default function MiniTreeMap({ data, isActive = false }: MiniTreeMapProps) {
  if (!data || data.length === 0) {
    return <TextPlaceHolder>No data</TextPlaceHolder>
  }


  return (
    <div className="w-full h-full pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="cnt"
          nameKey="value"
          fill={isActive ? "var(--chart-active-fill)" : "var(--chart-default-fill)"}
          content={<TreeMapCustomizedContent isActive={isActive} />}
          isAnimationActive={false}
        />
      </ResponsiveContainer>
    </div>
  )
}