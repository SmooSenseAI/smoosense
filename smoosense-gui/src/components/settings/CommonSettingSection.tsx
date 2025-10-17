'use client'

import UISettingSlider from '@/components/ui/UISettingSlider'
import UISettingToggle from '@/components/ui/UISettingToggle'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function CommonSettingSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration issues - don't render until mounted
  if (!mounted) {
    return null
  }

  const themes = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Theme</label>
        <div className="flex rounded-lg border bg-background p-1">
          {themes.map((themeOption) => (
            <Button
              key={themeOption.value}
              variant={theme === themeOption.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme(themeOption.value)}
              className="w-8 h-8 p-0"
              title={themeOption.label}
            >
              {themeOption.icon}
            </Button>
          ))}
        </div>
      </div>
      <UISettingToggle
        settingKey="debugMode"
        label="Debug Mode"
      />
      <UISettingSlider
        settingKey="fontSize"
        label="Font Size"
        min={12}
        max={18}
        step={1}
      />
    </div>
  )
}