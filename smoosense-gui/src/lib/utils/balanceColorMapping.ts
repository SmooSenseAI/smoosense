/**
 * Color mapping utilities for converting breakdown histogram vectors to RGB colors
 */

// Predefined colors for breakdown values (using distinct, accessible colors)
const BREAKDOWN_COLORS: string[] = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#bcbd22', // yellow-green
  '#17becf', // cyan/teal
]

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): [number, number, number] {
  // Return gray for invalid/undefined colors
  if (!hex || typeof hex !== 'string') {
    return [128, 128, 128] // Gray
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    console.warn(`Invalid hex color: ${hex}, using gray instead`)
    return [128, 128, 128] // Gray
  }

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ]
}

/**
 * Convert RGB values to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert a breakdown histogram vector to an RGB color
 *
 * @param histogram - Object with breakdown values as keys and counts as values
 * @param breakdownValues - Array of all possible breakdown values (for consistent color assignment)
 * @returns Hex color string
 */
export function histogramToColor(
  histogram: Record<string, number>,
  breakdownValues: string[]
): string {
  // Use all breakdown values, treating missing ones as 0
  const counts = breakdownValues.map(value => histogram[value] || 0)
  const totalCount = counts.reduce((sum, count) => sum + count, 0)

  // Handle empty histogram
  if (totalCount === 0) {
    return '#808080' // Gray for empty
  }

  // Scale counts to percentages that sum to 100
  const percentages = counts.map(count => (count / totalCount) * 100)

  // Filter out zero counts for color calculation
  const nonZeroCounts = counts.filter(count => count > 0)
  const nonZeroValues = breakdownValues.filter(value => (histogram[value] || 0) > 0)

  // Single breakdown value - use its assigned color directly
  if (nonZeroCounts.length === 1) {
    const value = nonZeroValues[0]
    const index = breakdownValues.indexOf(value)
    return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]
  }

  // Calculate saturation factor based on percentage range
  const maxPercentage = Math.max(...percentages)
  const minPercentage = Math.min(...percentages)
  const saturationFactor = (maxPercentage - minPercentage) / 100

  // Calculate weighted average of colors using non-zero percentages
  let totalR = 0, totalG = 0, totalB = 0

  nonZeroValues.forEach((value) => {
    const index = breakdownValues.indexOf(value)
    const weight = percentages[index] / 100 // Convert back to proportion for color mixing
    const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]

    const [r, g, b] = hexToRgb(color)

    totalR += r * weight
    totalG += g * weight
    totalB += b * weight
  })

  // Gray color (for uniform distribution)
  const grayValue = 128

  // Interpolate between weighted color and gray based on saturation factor
  // High range (imbalanced) -> more towards the dominant color
  // Low range (balanced) -> more gray

  const finalR = totalR * saturationFactor + grayValue * (1 - saturationFactor)
  const finalG = totalG * saturationFactor + grayValue * (1 - saturationFactor)
  const finalB = totalB * saturationFactor + grayValue * (1 - saturationFactor)

  return rgbToHex(finalR, finalG, finalB)
}

/**
 * Get the assigned color for a specific breakdown value
 */
export function getBreakdownColor(breakdownValue: string, breakdownValues: string[]): string {
  const valueAsString = String(breakdownValue)
  const index = breakdownValues.indexOf(valueAsString)
  if (index === -1) {
    return '#808080' // Gray for unknown values
  }
  return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]
}

/**
 * Get all breakdown colors for legend/reference
 */
export function getAllBreakdownColors(breakdownValues: string[]): Record<string, string> {
  const colors: Record<string, string> = {}
  breakdownValues.forEach(value => {
    colors[value] = getBreakdownColor(value, breakdownValues)
  })
  return colors
}