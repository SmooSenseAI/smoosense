'use client'

import React from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'
import { getBreakdownColor } from '@/lib/utils/balanceColorMapping'

interface BalanceMapTooltipProps {
  x: number
  y: number
  xColumn: string
  yColumn: string
  count: number
  breakdownHistogram: Record<string, number>
  breakdownTotalCounts: Record<string, number>
  allBreakdownValues: string[]
  visible: boolean
}

const BalanceMapTooltip = React.memo(function BalanceMapTooltip({
  x,
  y,
  xColumn,
  yColumn,
  count,
  breakdownHistogram,
  breakdownTotalCounts,
  allBreakdownValues,
  visible
}: BalanceMapTooltipProps) {
  if (!visible || !breakdownHistogram) {
    return null
  }

  // Prepare data for pie chart with ratio calculations
  const pieData = allBreakdownValues
    .map(value => {
      const count = breakdownHistogram[value] || 0
      const totalCount = breakdownTotalCounts[value] || 1
      const ratio = totalCount > 0 ? count / totalCount : 0

      return {
        name: value,
        value: ratio,
        count: count,
        total: totalCount,
        percentage: (ratio * 100).toFixed(4),
        color: getBreakdownColor(value, allBreakdownValues)
      }
    })
    .filter(item => item.count > 0) // Only show categories that have data

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[320px] z-50">
      {/* Top section: Pie chart and header side-by-side */}
      <div className="flex gap-3 mb-3">
        {/* Pie chart showing ratio comparison */}
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={40}
                dataKey="value"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Header with coordinates and count */}
        <div className="flex-1 text-sm">
          <div><strong>X {xColumn}:</strong> ~{x?.toFixed(2)}</div>
          <div><strong>Y {yColumn}:</strong> ~{y?.toFixed(2)}</div>
          <div><strong>Count:</strong> {count}</div>
        </div>
      </div>

      {/* Bottom section: Legend with detailed info */}
      <div className="text-xs space-y-1 border-t pt-2">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
            <span>{entry.count}/{entry.total} ({entry.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
})

export default BalanceMapTooltip