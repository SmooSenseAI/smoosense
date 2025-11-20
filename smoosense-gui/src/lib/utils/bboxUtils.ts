import { CDN_URL } from './urlUtils'
import { mayResolveUrl } from './mediaUrlUtils'

/**
 * Parse bbox value - must be array of 4 numbers: [x, y, width, height]
 */
export function parseBbox(value: unknown): number[] | null {
  if (Array.isArray(value) && value.length === 4 && value.every(v => typeof v === 'number' && !isNaN(v))) {
    return value as number[]
  }
  return null
}

/**
 * Build the viz-bbox.html URL for displaying bounding boxes on an image
 * @param imageUrl - URL of the image
 * @param bboxes - Array of bbox arrays (each bbox is [x, y, width, height])
 * @param tablePath - The current table path (for resolving relative paths)
 * @param baseUrl - Base URL to prepend to resolved URLs
 * @param labels - Optional array of labels for each bbox
 * @param autorange - Whether to auto-range the visualization (default: true)
 * @returns The viz-bbox.html URL
 */
export function buildBboxVizUrl(
  imageUrl: string,
  bboxes: number[][],
  tablePath: string,
  baseUrl: string,
  labels?: string[],
  autorange: boolean = true
): string {
  const bboxObjects = bboxes.map((bbox, index) => ({
    bbox,
    label: labels?.[index] || ''
  }))

  // Resolve the image URL using the same logic as other media URLs
  const resolvedImageUrl = mayResolveUrl({ value: imageUrl, tablePath, baseUrl })

  const bboxesParam = encodeURIComponent(JSON.stringify(bboxObjects))
  const imageParam = encodeURIComponent(resolvedImageUrl)
  const autorangeParam = autorange ? 'true' : 'false'

  return `${CDN_URL}/viz-bbox.html?image=${imageParam}&bboxes=${bboxesParam}&autorange=${autorangeParam}`
}
