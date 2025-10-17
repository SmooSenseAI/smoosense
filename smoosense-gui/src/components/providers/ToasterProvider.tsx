'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToasterProvider() {
  const { theme, systemTheme } = useTheme()
  
  // Determine the actual theme being used
  const actualTheme = theme === 'system' ? systemTheme : theme
  
  return (
    <Toaster 
      richColors 
      theme={actualTheme as 'light' | 'dark' | undefined}
      closeButton
      position="bottom-right"
    />
  )
}