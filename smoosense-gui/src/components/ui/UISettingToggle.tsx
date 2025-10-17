'use client'

import { useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'

interface UISettingToggleProps {
  settingKey: string
  label: string
  description?: string
}

export default function UISettingToggle({
  settingKey,
  label,
  description
}: UISettingToggleProps) {
  const dispatch = useAppDispatch()

  // Get the current value from state.ui[settingKey]
  const currentValue = useAppSelector((state) => {
    return (state.ui as unknown as Record<string, unknown>)[settingKey] as boolean
  })

  const handleToggle = useCallback((checked: boolean) => {
    const setterFunctionName = `set${settingKey.charAt(0).toUpperCase() + settingKey.slice(1)}`

    // Dynamically import and call the appropriate setter
    import('@/lib/features/ui/uiSlice').then((uiSlice) => {
      const setter = (uiSlice as Record<string, unknown>)[setterFunctionName]
      if (typeof setter === 'function') {
        dispatch(setter(checked))
      } else {
        console.warn(`Setter function ${setterFunctionName} not found`)
      }
    })
  }, [dispatch, settingKey])

  return (
    <div className="space-y-1 flex-1 min-w-[200px]">
      <div className="flex items-center justify-start gap-4">
        <Switch
            id={`${settingKey}-toggle`}
            checked={currentValue}
            onCheckedChange={handleToggle}
            className={'cursor-pointer'}
        />
        <label htmlFor={`${settingKey}-toggle`} className="text-sm font-medium cursor-pointer">
          {label}
        </label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}