'use client'

import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import TextPlaceHolder from '../common/TextPlaceHolder'
import type { HistogramCntValue } from '@/lib/features/colStats/types'

interface MiniHistogramProps {
  data: HistogramCntValue[]
  isActive?: boolean
}

export default function MiniHistogram({ data, isActive = false }: MiniHistogramProps) {
  if (!data || data.length === 0) {
    return <TextPlaceHolder>No data</TextPlaceHolder>
  }
  const color = isActive ? "var(--chart-active-fill)" : "var(--chart-default-fill)"

  return (
    <div className="w-full h-full pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <Bar 
            dataKey="cnt" 
            fill={color}
            stroke={color}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}