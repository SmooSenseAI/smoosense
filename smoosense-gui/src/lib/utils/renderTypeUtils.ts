import { RenderType } from './agGridCellRenderers'
import _, { isNil } from 'lodash'
import { getFileType, FileType } from './fileTypes'
import { isUrl, isAllUrlType } from './urlUtils'

/**
 * Check if a render type is a media type (image, video, pdf, image mask, or media lists)
 */
export function isMediaType(renderType: RenderType): boolean {
  return [
    RenderType.ImageUrl,
    RenderType.VideoUrl,
    RenderType.PdfUrl,
    RenderType.ImageMask,
    RenderType.ImageList,
    RenderType.VideoList
  ].includes(renderType)
}

/**
 * Check if a render type supports visual content (media + iframe + bbox + audio + json + huggingface media + media lists)
 */
export function isVisualType(renderType: RenderType): boolean {
  return [
    RenderType.ImageUrl,
    RenderType.VideoUrl,
    RenderType.PdfUrl,
    RenderType.ImageMask,
    RenderType.IFrame,
    RenderType.Bbox,
    RenderType.AudioUrl,
    RenderType.Json,
    RenderType.HuggingFaceMedia,
    RenderType.ImageList,
    RenderType.VideoList,
    RenderType.AudioList
  ].includes(renderType)
}

// Helper functions for string analysis
function inferUrlType(str: string): RenderType {
  // Check for iframe+http(s):// prefix first
  if (str.startsWith('iframe+http://') || str.startsWith('iframe+https://')) {
    return RenderType.IFrame
  }

  // Extract filename from URL for file type detection
  const urlParts = str.split('/')
  const filename = urlParts[urlParts.length - 1].split('?')[0] // Remove query parameters
  const fileType = getFileType(filename)

  // Check file type first
  if (fileType === FileType.Image) {
    return RenderType.ImageUrl
  }

  if (fileType === FileType.Video) {
    return RenderType.VideoUrl
  }

  if (fileType === FileType.Audio) {
    return RenderType.AudioUrl
  }

  if (fileType === FileType.Pdf) {
    return RenderType.PdfUrl
  }

  // Check for video streaming platforms
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(str)) {
    return RenderType.VideoUrl
  }

  // Default to hyperlink for other URLs
  return RenderType.HyperLink
}

export function isDateString(str: string): boolean {
  // More strict date validation
  // Check for common date formats: YYYY-MM-DD, MM/DD/YYYY, etc.
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
  ]

  // Must match at least one date pattern
  const matchesPattern = datePatterns.some(pattern => pattern.test(str.trim()))

  if (!matchesPattern) return false

  // Additional validation: must be a valid date
  const dateValue = new Date(str)
  return !isNaN(dateValue.getTime())
}

function isNumberString(str: string): boolean {
  const numValue = Number(str.trim())
  return !isNaN(numValue) && str.trim() !== ''
}

export function inferRenderTypeFromData(columnValues: unknown[], columnName?: string): RenderType {
  // Filter out null and undefined values
  const nonNullValues = columnValues.filter(value => !isNil(value))

  if (nonNullValues.length === 0) return RenderType.Null

  // Check if all non-null values are booleans
  if (nonNullValues.every(value => typeof value === 'boolean')) {
    return RenderType.Boolean
  }

  // Check if all non-null values are numbers
  if (nonNullValues.every(value => typeof value === 'number' && !isNaN(value))) {
    return RenderType.Number
  }

  // Check if all non-null values are dates
  if (nonNullValues.every(value => value instanceof Date)) {
    return RenderType.Date
  }

  // Check if all non-null values are objects (but not dates)
  if (nonNullValues.every(value => typeof value === 'object' && !(value instanceof Date))) {
    // Check if column name contains 'bbox' and values are arrays of 4 numbers
    if (columnName && _.includes(columnName.toLowerCase(), 'bbox')) {
      const isBboxFormat = nonNullValues.every(value =>
        _.isArray(value) &&
        value.length === 4 &&
        _.every(value, _.isNumber)
      )

      if (isBboxFormat) {
        return RenderType.Bbox
      }
    }

    // Check if all values are arrays of strings that are media URLs
    const allArrays = nonNullValues.every(value => _.isArray(value))
    if (allArrays) {
      // Check for image list
      const isImageList = nonNullValues.every(value => {
        const arr = value as unknown[]
        if (arr.length === 0) return true
        return isAllUrlType(arr, FileType.Image)
      })
      if (isImageList) {
        return RenderType.ImageList
      }

      // Check for video list
      const isVideoList = nonNullValues.every(value => {
        const arr = value as unknown[]
        if (arr.length === 0) return true
        return isAllUrlType(arr, FileType.Video)
      })
      if (isVideoList) {
        return RenderType.VideoList
      }

      // Check for audio list
      const isAudioList = nonNullValues.every(value => {
        const arr = value as unknown[]
        if (arr.length === 0) return true
        return isAllUrlType(arr, FileType.Audio)
      })
      if (isAudioList) {
        return RenderType.AudioList
      }
    }

    return RenderType.Json
  }

  // For strings, check if all non-null values match a specific pattern
  if (nonNullValues.every(value => typeof value === 'string')) {
    const stringValues = nonNullValues as string[]

    // First check if all strings are URLs, then determine specific URL type
    if (stringValues.every(str => isUrl(str.toLowerCase().trim()))) {
      // All are URLs, now check for specific types
      const normalizedUrls = stringValues.map(str => str.toLowerCase().trim())

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.ImageUrl)) {
        // Check if column name contains 'image_mask' for ImageMask render type
        if (columnName && columnName.includes('image_mask')) {
          return RenderType.ImageMask
        }
        return RenderType.ImageUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.VideoUrl)) {
        return RenderType.VideoUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.AudioUrl)) {
        return RenderType.AudioUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.PdfUrl)) {
        return RenderType.PdfUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.IFrame)) {
        return RenderType.IFrame
      }

      // Mixed URL types or all are generic hyperlinks
      return RenderType.HyperLink
    }

    if (stringValues.every(str => isDateString(str))) {
      return RenderType.Date
    }

    if (stringValues.every(str => isNumberString(str))) {
      return RenderType.Number
    }

    // Check if column name contains 'word_score' for WordScores render type
    if (columnName && columnName.includes('word_score')) {
      return RenderType.WordScores
    }

    // Check if all strings start with 'shell$' prefix for ShellCommand render type
    if (stringValues.every(str => str.startsWith('shell$'))) {
      return RenderType.ShellCommand
    }
  }

  // Default to Text for mixed types or anything else
  return RenderType.Text
}