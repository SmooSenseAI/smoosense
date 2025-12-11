'use client'

import { ReactNode } from 'react'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LabeledSliderProps {
  label: string
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
  step?: number
  formatValue?: (value: number) => string
  hoverComponent?: ReactNode
  className?: string
}

export default function LabeledSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue,
  hoverComponent,
  className = 'flex-1 min-w-24 max-w-60',
}: LabeledSliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value)

  const labelContent = (
    <span className={hoverComponent ? 'cursor-help' : ''}>
      {label}: {displayValue}
    </span>
  )

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-foreground">
        {hoverComponent ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {labelContent}
              </TooltipTrigger>
              <TooltipContent className="w-80 text-sm p-3 bg-card border border-border" side="top">
                {hoverComponent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          labelContent
        )}
      </label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onValueChange(values[0])}
      />
    </div>
  )
}
