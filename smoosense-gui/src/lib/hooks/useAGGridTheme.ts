import { useMemo } from 'react'
import { useAppSelector } from '@/lib/hooks'
import { useTheme } from 'next-themes'
import { themeQuartz, ColDef, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'

interface AGGridThemeOptions {
  withPadding?: boolean
}

/**
 * Custom hook for AG Grid theming using shadcn/ui design tokens
 * Automatically adapts to the app's dark/light mode and font size settings
 * @param options - Configuration options for the theme
 * @param options.withPadding - When true, sets cellHorizontalPaddingScale to 100% (default: false)
 */
export function useAGGridTheme(options: AGGridThemeOptions = {}) {
  const { withPadding = true } = options
  const fontSize = useAppSelector((state) => state.ui.fontSize)
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  
  const agTheme = useMemo(() => {
    return themeQuartz
        .withPart(isDark ? colorSchemeDark : colorSchemeLight)
      .withParams({
        // Font configuration using Geist Sans
        fontSize: fontSize,
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        accentColor: 'var(--ring)',
        cellTextColor: 'var(--foreground)',
        backgroundColor: 'var(--background)',
        rowVerticalPaddingScale: withPadding ? 1 : 0,
        cellHorizontalPaddingScale: withPadding ? 1 : 0,
        selectedRowBackgroundColor: 'transparent',
        headerHeight: Math.round(fontSize * 2.8),
        // Icon size relative to font size
        iconSize: Math.round(fontSize * 0.9),
        columnBorder: true,
        rowBorder: true,
        wrapperBorderRadius: 0,

      })
  }, [fontSize, isDark, withPadding])

  return agTheme
}

/**
 * Get default column definitions with shadcn/ui theme-aware styling
 */
export function useAGGridDefaultColDef(): ColDef {

  return useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: false,
    headerClass: 'ag-header-cell-text',
    floatingFilter: false,
    wrapText: true,
  }), [])
}

/**
 * Get grid options with theme-aware configurations
 */
export function useAGGridOptions() {

  return useMemo(() => ({
    animateRows: false,
    pagination: false,
  }), [])
}