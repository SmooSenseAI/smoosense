'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Brush } from 'recharts'
import TextPlaceHolder from '@/components/common/TextPlaceHolder'
import type { NullFilterOption } from '@/lib/features/colDefs/agSlice'
import type { HistogramCntValue } from '@/lib/features/colStats/types'

interface RangeFilterSectionProps {
  data: HistogramCntValue[]
  cntAll: number
  nullFilterOption: NullFilterOption
  onNullFilterChange: (value: NullFilterOption) => void
  onRangeUpdate: (data: number[]) => void
  range: number[] | undefined
  isActive?: boolean
}

export default function RangeFilterSection({
  data,
  cntAll,
  nullFilterOption,
  onNullFilterChange,
  onRangeUpdate,
  range,
  isActive = false
}: RangeFilterSectionProps) {
  // Initialize range with passed range or min/max from data
  const initialMin = range && range.length > 0 ? range[0] : (data.length > 0 ? data[0].binMin : 0);
  const initialMax = range && range.length > 1 ? range[1] : (data.length > 0 ? data[data.length - 1].binMax : 100);
  
  const [rangeMin, setRangeMin] = useState(initialMin);
  const [rangeMax, setRangeMax] = useState(initialMax);

  // Notify parent when range changes
  useEffect(() => {
      onRangeUpdate([rangeMin, rangeMax])
  }, [rangeMin, rangeMax, onRangeUpdate])

  if (!data || data.length === 0) {
    return <TextPlaceHolder className="text-sm">No histogram data available</TextPlaceHolder>
  }

  return (
    <div className="space-y-4">
      {/* Large chart */}
      <div className="border rounded p-3" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
          >
            <XAxis 
              dataKey="value"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              isAnimationActive={false}
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  const percentage = ((data.cnt / cntAll) * 100).toFixed(1);
                  return (
                    <div className="bg-background border rounded p-2 shadow-md text-sm">
                      <div className="font-medium">{data.value}</div>
                      <div className="text-muted-foreground">Count: {data.cnt}</div>
                      <div className="text-muted-foreground">Percentage: {percentage}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="cnt"
              fill={isActive ? "var(--chart-active-fill)" : "var(--chart-default-fill)"}
              stroke="none"
              isAnimationActive={false}
            />
            <Brush 
              dataKey="value"
              height={10}
              travellerWidth={8}
              stroke="var(--primary)"
              tickFormatter={() => ''}
              onChange={(brushData) => {
                if (brushData && data) {
                  const { startIndex, endIndex } = brushData;
                  const startBin = data[startIndex];
                  const endBin = data[endIndex];
                  if (startBin) {
                    setRangeMin(startBin.binMin);
                  }
                  if (endBin) {
                    setRangeMax(endBin.binMax);
                  }
                  if (nullFilterOption === 'Include') {
                    onNullFilterChange('Exclude');
                  }
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Range Input Section */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Range Min</label>
          <input
            type="number"
            value={rangeMin}
            onChange={(e) => setRangeMin(Number(e.target.value))}
            className="flex-1 px-2 py-1 text-xs border rounded"
            step="any"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Range Max</label>
          <input
            type="number"
            value={rangeMax}
            onChange={(e) => setRangeMax(Number(e.target.value))}
            className="flex-1 px-2 py-1 text-xs border rounded"
            step="any"
          />
        </div>
      </div>

    </div>
  )
}