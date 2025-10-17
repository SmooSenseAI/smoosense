'use client'

import { useMemo } from 'react'
import { PieChart, Pie, ResponsiveContainer } from 'recharts'

interface NullPieProps {
  cntNull: number
  cntNotNull: number
  className?: string
}

export default function NullPie({
  cntNull,
  cntNotNull,
  className = ''
}: NullPieProps) {
  const chartData = useMemo(() => {
    const total = cntNull + cntNotNull
    
    if (total === 0) {
      return []
    }

    return [
      {
        name: 'Not Null',
        value: cntNotNull,
        fill: 'var(--chart-default-fill)'
      },
      {
        name: 'Null',
        value: cntNull,
        fill: 'var(--chart-warning-fill)'
      }
    ].filter(item => item.value > 0) // Only include segments with data
  }, [cntNull, cntNotNull])

  if (chartData.length === 0) {
    return (
      <div 
        className={`pointer-events-none flex items-center justify-center ${className}`}
        style={{ width: 36, height: 36 }}
      >
        <div className="w-full h-full rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <div 
      className={`pointer-events-none ${className}`}
      style={{ width: 36, height: 36 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius="100%"
            stroke='var(--background)'
            isAnimationActive={false}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}