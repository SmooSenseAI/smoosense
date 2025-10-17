/**
 * Plotly theming hooks with hardcoded colors
 * Provides consistent styling across charts using Redux state
 */

import { useMemo } from 'react'
import { useAppSelector } from '@/lib/hooks'
import { useTheme } from 'next-themes'

// Get hardcoded colors for light and dark themes
const getPlotlyColors = (isDark = false) => ({
  background: isDark ? '#0f172a' : '#ffffff',
  foreground: isDark ? '#f1f5f9' : '#0f172a',
  card: isDark ? '#1e293b' : '#f8fafc',
  cardForeground: isDark ? '#f1f5f9' : '#0f172a',
  muted: isDark ? '#334155' : '#f1f5f9',
  mutedForeground: isDark ? '#94a3b8' : '#64748b',
  border: isDark ? '#334155' : '#e2e8f0',
  primary: isDark ? '#3b82f6' : '#2563eb',
  primaryForeground: isDark ? '#f1f5f9' : '#ffffff',
})

/**
 * Hook to get Plotly colors based on current theme
 */
export const usePlotlyColors = () => {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  
  return useMemo(() => getPlotlyColors(isDark), [isDark])
}

/**
 * Hook to configure Plotly axis with theming
 */
export const usePlotlyAxis = ({ 
  title, 
  showTickLabels = true
}: { 
  title: string
  showTickLabels?: boolean
}) => {
  const { theme, systemTheme } = useTheme()
  const fontSize = useAppSelector((state) => state.ui.fontSize)
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  
  const colors = useMemo(() => getPlotlyColors(isDark), [isDark])
  
  return useMemo(() => ({
    title: {
      text: title,
      font: {
        color: colors.foreground,
        size: Math.round(fontSize * 1.0),
        family: 'system-ui, -apple-system, sans-serif'
      }
    },
    showticklabels: showTickLabels,
    showline: false,
    showgrid: true,
    gridcolor: colors.border,
    tickfont: {
      color: colors.mutedForeground,
      size: Math.round(fontSize * 0.85),
      family: 'system-ui, -apple-system, sans-serif'
    },
    linecolor: colors.border,
    zerolinecolor: colors.border
  }), [colors, title, showTickLabels, fontSize])
}

/**
 * Hook to configure common Plotly layout with theming
 */
export const usePlotlyLayout = ({ 
  xTitle = '', 
  yTitle = '',
  showLegend = true
}: { 
  xTitle?: string
  yTitle?: string
  showLegend?: boolean
}) => {
  const { theme, systemTheme } = useTheme()
  const fontSize = useAppSelector((state) => state.ui.fontSize)
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  
  const colors = useMemo(() => getPlotlyColors(isDark), [isDark])
  const xAxis = usePlotlyAxis({ title: xTitle })
  const yAxis = usePlotlyAxis({ title: yTitle })

  return useMemo(() => ({
    title: {
      text: '',
      font: {
        color: colors.foreground,
        family: 'system-ui, -apple-system, sans-serif'
      }
    },
    xaxis: xAxis,
    yaxis: yAxis,
    paper_bgcolor: colors.background,
    plot_bgcolor: colors.card,
    font: {
      color: colors.foreground,
      family: 'system-ui, -apple-system, sans-serif'
    },
    margin: {
      l: Math.round(fontSize * 4.3),
      r: Math.round(fontSize * 2.1),
      t: Math.round(fontSize * 2.1),
      b: Math.round(fontSize * 4.3)
    },
    dragmode: 'pan' as const,
    showlegend: showLegend,
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: 1.02,
      font: {
        color: colors.foreground,
        family: 'system-ui, -apple-system, sans-serif'
      }
    },
    hovermode: 'closest' as const
  }), [colors, xAxis, yAxis, showLegend, fontSize])
}


/**
 * Hook to configure Plotly histogram-specific styling
 */
export const useHistogramLayout = ({ 
  xTitle = '', 
  yTitle = 'Count',
  barmode = 'stack'
}: {
  xTitle?: string
  yTitle?: string
  barmode?: 'stack' | 'overlay' | 'group'
}) => {
  const baseLayout = usePlotlyLayout({ xTitle, yTitle })
  
  return useMemo(() => ({
    ...baseLayout,
    barmode,
    bargap: 0.1,
    bargroupgap: 0.1,
    // Override xaxis for histograms
    xaxis: {
      ...baseLayout.xaxis,
      showticklabels: false, // Hide tick labels for histogram bins
      showgrid: false
    }
  }), [baseLayout, barmode])
}

/**
 * Hook to get default Plotly config
 */
export const usePlotlyConfig = () => {
  return useMemo(() => ({
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'pan2d',
      'select2d',
      'lasso2d',
      'resetScale2d',
      'zoomIn2d',
      'zoomOut2d',
      'autoScale2d'
    ]
  }), [])
}