import {API_PREFIX} from './urlUtils'
import {pathDirname, pathJoin} from './pathUtils'
import {getFileType, FileType} from './fileTypes'

/**
 * Check if a URL needs to be resolved
 * Returns true if:
 * - Value is a string
 * - AND starts with ./, /, ~/, or s3://
 * - AND has a media file extension (image, video, or audio)
 */
export const needToResolveMediaUrl = (value: unknown): boolean => {
  // Must be a string
  if (typeof value !== 'string') {
    return false
  }


  // Must start with relative or absolute path prefix
  if (
    !value.startsWith('./') &&
    !value.startsWith('/') &&
    !value.startsWith('~/') &&
    !value.startsWith('s3://')
  ) {
    return false
  }

  // Must be a media file
  const fileType = getFileType(value)
  return fileType === FileType.Image || fileType === FileType.Video || fileType === FileType.Audio
}

/**
 * Resolve relative path based on tablePath type (local, S3, or HTTP/HTTPS)
 */
function resolveRelativePath(tablePath: string, relativePath: string): string {
  const cleanRelative = relativePath.substring(2) // Remove './' prefix

  // Case 1: S3 tablePath (e.g., s3://bucket/folder/file.parquet)
  if (tablePath.startsWith('s3://')) {
    // Extract the directory path from S3 URL
    const lastSlashIndex = tablePath.lastIndexOf('/')
    const dirPath = tablePath.substring(0, lastSlashIndex)

    // Handle parent directory references (..)
    const parts = dirPath.substring(5).split('/') // Remove 's3://' and split
    const bucket = parts.shift() // First part is bucket name
    const relativeParts = cleanRelative.split('/')

    for (const part of relativeParts) {
      if (part === '..') {
        parts.pop()
      } else if (part !== '.' && part !== '') {
        parts.push(part)
      }
    }

    return `s3://${bucket}/${parts.join('/')}`
  }

  // Case 2: HTTP/HTTPS tablePath (e.g., https://example.com/data/file.parquet)
  if (tablePath.startsWith('http://') || tablePath.startsWith('https://')) {
    try {
      const tableUrl = new URL(tablePath)
      // Get directory by removing filename
      const pathParts = tableUrl.pathname.split('/')
      pathParts.pop() // Remove filename
      const dirPath = pathParts.join('/')

      // Resolve relative path using URL API
      const resolved = new URL(cleanRelative, tableUrl.origin + dirPath + '/').href
      return resolved
    } catch {
      // If URL parsing fails, fall back to returning original tablePath
      return tablePath
    }
  }

  // Case 3: Local file path (e.g., /data/folder/file.parquet)
  const dirPath = pathDirname(tablePath)
  return pathJoin(dirPath, cleanRelative)
}

/**
 * Resolve asset URLs to full URLs, handling relative paths, absolute paths, S3 URLs, and remote URLs
 * @param url - The URL or file path to resolve
 * @param tablePath - The current table path (for resolving relative paths like ./)
 * @param baseUrl - The base URL to prepend (for absolute paths like / or ~/)
 * @returns The resolved full URL
 */
export const resolveAssetUrl = (url: string, tablePath: string, baseUrl: string): string => {
  let fullUrl = url

  // If URL starts with "./", resolve it relative to tablePath
  if (url.startsWith('./')) {
    fullUrl = resolveRelativePath(tablePath, url)
  }

  let relativeUrl = null
  // If URL starts with '/' or '~/', convert to API endpoint
  if (fullUrl.startsWith('/') || fullUrl.startsWith('~/')) {
    const params = new URLSearchParams({
      path: fullUrl,
      redirect: 'false'
    })
    relativeUrl = `${API_PREFIX}/get-file?${params.toString()}`
  } else if (fullUrl.startsWith('s3://')){
    relativeUrl = `${API_PREFIX}/s3-proxy?url=${encodeURIComponent(fullUrl)}`
  } else {
    return fullUrl
  }

  // Remove leading ./ if present
  const cleanUrl = relativeUrl.startsWith('./') ? relativeUrl.substring(2) : relativeUrl

  // Prepend baseUrl
  return baseUrl + '/' + cleanUrl
}
