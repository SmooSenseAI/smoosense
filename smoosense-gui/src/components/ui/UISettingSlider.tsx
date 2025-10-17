'use client'

import { useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'

interface UISettingSliderProps {
  settingKey: string
  label: string
  min: number
  max: number
  step?: number
}

export default function UISettingSlider({
  settingKey,
  label,
  min,
  max,
  step = 1
}: UISettingSliderProps) {
  const dispatch = useAppDispatch()

  // Get the current value from state.ui[settingKey]
  const currentValue = useAppSelector((state) => {
    return (state.ui as unknown as Record<string, unknown>)[settingKey] as number
  })

  const handleValueChange = useCallback((value: number[]) => {
    const setterFunctionName = `set${settingKey.charAt(0).toUpperCase() + settingKey.slice(1)}`

    // Dynamically import and call the appropriate setter
    import('@/lib/features/ui/uiSlice').then((uiSlice) => {
      const setter = (uiSlice as Record<string, unknown>)[setterFunctionName]
      if (typeof setter === 'function') {
        dispatch(setter(value[0]))
      } else {
        console.warn(`Setter function ${setterFunctionName} not found`)
      }
    })
  }, [dispatch, settingKey])

  return (
    <div className="space-y-2">
      <label htmlFor={`${settingKey}-slider`} className="text-sm font-medium flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{currentValue}{step < 1 ? '' : 'px'}</span>
      </label>
      <Slider
        id={`${settingKey}-slider`}
        min={min}
        max={max}
        step={step}
        value={[currentValue]}
        onValueChange={handleValueChange}
        className="w-full [&_[data-slot=slider-track]]:bg-muted/60 [&_[data-slot=slider-range]]:bg-primary"
      />
    </div>
  )
}