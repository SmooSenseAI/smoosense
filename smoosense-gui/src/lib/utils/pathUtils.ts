/**
 * Simple path utilities for absolute paths and URLs
 */

/**
 * Check if a path is a URL (contains ://)
 */
export function isUrl(path: string): boolean {
  return typeof path === 'string' && path.includes('://')
}

/**
 * Join path segments - simple string concatenation with slash handling
 */
export function pathJoin(...segments: string[]): string {
  if (segments.length === 0) return ''
  
  const validSegments = segments.filter(s => s && typeof s === 'string' && s.trim() !== '')
  if (validSegments.length === 0) return ''
  if (validSegments.length === 1) return validSegments[0]
  
  let result = validSegments[0]
  
  for (let i = 1; i < validSegments.length; i++) {
    const segment = validSegments[i]
    
    // Add slash if result doesn't end with slash and segment doesn't start with slash
    if (!result.endsWith('/') && !segment.startsWith('/')) {
      result += '/'
    }
    // Remove duplicate slash if both have slash
    else if (result.endsWith('/') && segment.startsWith('/')) {
      result = result.slice(0, -1)
    }
    
    result += segment
  }
  
  return result
}

/**
 * Get the base name (last component) of a path
 */
export function pathBasename(path: string): string {
  if (!path || typeof path !== 'string') return ''
  
  // Handle top-level cases - return the path itself
  if (path === '/' || path === '~') {
    return path
  }
  
  if (isUrl(path)) {
    // For URLs: check if it's just protocol://bucket
    const cleanPath = path.replace(/\/+$/, '')
    const slashAfterProtocol = cleanPath.indexOf('://') + 3
    const remainingPath = cleanPath.substring(slashAfterProtocol)
    
    // If no path after bucket, return the whole URL
    if (!remainingPath.includes('/')) {
      return path
    }
    
    // Otherwise get part after last /
    const lastSlash = cleanPath.lastIndexOf('/')
    return lastSlash === -1 ? '' : cleanPath.substring(lastSlash + 1)
  } else {
    // For regular paths: handle both / and \ separators, remove trailing slashes
    const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '')
    const lastSlash = normalized.lastIndexOf('/')
    return lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1)
  }
}

/**
 * Get the parent directory of a path (for folders) or containing directory (for files)
 */
export function pathParent(path: string): string {
  if (!path || typeof path !== 'string') return ''
  
  // Handle top-level cases - return empty string
  if (path === '/' || path === '~') {
    return ''
  }
  
  if (isUrl(path)) {
    // For URLs: remove trailing slashes first, then get parent
    const cleanPath = path.replace(/\/+$/, '')
    const lastSlash = cleanPath.lastIndexOf('/')
    if (lastSlash === -1) return ''
    const dirname = cleanPath.substring(0, lastSlash)
    
    // Check if the dirname would be just protocol://bucket (top-level)
    const slashAfterProtocol = cleanPath.indexOf('://') + 3
    const pathAfterBucket = cleanPath.substring(slashAfterProtocol)
    
    // If the current path is just protocol://bucket, return empty
    if (!pathAfterBucket.includes('/')) return ''
    
    // If the dirname would be just protocol://bucket, return it
    const dirnameAfterProtocol = dirname.substring(slashAfterProtocol)
    if (!dirnameAfterProtocol.includes('/')) return dirname
    
    return dirname
  } else {
    // For regular paths: handle both / and \ separators, remove trailing slashes
    const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '')
    const lastSlash = normalized.lastIndexOf('/')
    if (lastSlash === -1) return ''  // No parent for single filename
    if (lastSlash === 0) return '/'  // Parent of /file is /
    return normalized.substring(0, lastSlash)
  }
}

/**
 * Get the file extension from a path
 */
export function pathExtension(path: string): string {
  const basename = pathBasename(path)
  const lastDot = basename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) return ''
  return basename.substring(lastDot)
}

/**
 * Get the relative path from a base path to a target path
 * Returns empty string if target doesn't start with base or if they're equal
 */
export function pathRelative(targetPath: string, basePath: string): string {
  if (!targetPath || !basePath || typeof targetPath !== 'string' || typeof basePath !== 'string') {
    return ''
  }

  // Normalize trailing slashes for comparison
  const normalizedBase = basePath.replace(/\/+$/, '')
  const normalizedTarget = targetPath.replace(/\/+$/, '')

  // If they're the same, return empty string
  if (normalizedBase === normalizedTarget) {
    return ''
  }

  // Check if target starts with base
  if (!normalizedTarget.startsWith(normalizedBase)) {
    return ''
  }

  // Extract the relative part
  let relativePath = normalizedTarget.substring(normalizedBase.length)

  // Remove leading slash if present
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1)
  }

  return relativePath
}

// Keep pathDirname as an alias for backward compatibility
export const pathDirname = pathParent

export function getLocalFolderPattern(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { LOCAL_FOLDER_PATTERN?: string | null }
  return w.LOCAL_FOLDER_PATTERN ?? null
}