export interface HuggingFaceMedia {
  bytes?: string // Data URL from backend: "data:{mimeType};base64,..."
  path?: string
}

/**
 * Check if a value is a valid HuggingFace media object
 */
export function isHuggingFaceMedia(value: unknown): value is HuggingFaceMedia {
  if (!value || typeof value !== 'object') return false
  const media = value as HuggingFaceMedia
  return typeof media.bytes === 'string' && typeof media.path === 'string'
}

/**
 * Get data URL from HuggingFace media
 * Backend already returns a complete data URL with MIME type
 * @param value - Unknown value that might be HuggingFace media
 * @returns Data URL string or null if not valid HuggingFace media
 */
export function toHuggingFaceDataUrl(value: unknown): string | null {
  if (!isHuggingFaceMedia(value)) return null
  if (!value.bytes || !value.bytes.startsWith('data:')) return null
  return value.bytes
}

/**
 * Get the path from a HuggingFace media object
 * @param value - Unknown value that might be HuggingFace media
 * @returns Path string or empty string if not valid
 */
export function getHuggingFaceMediaPath(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const media = value as HuggingFaceMedia
  return media.path || ''
}
