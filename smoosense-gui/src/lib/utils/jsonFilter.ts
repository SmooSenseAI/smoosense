/**
 * Filters JSON data based on a search term, returning only parts that match
 * the search criteria in keys, values, or paths.
 */

export interface JsonFilterOptions {
  /** Case-sensitive search (default: false) */
  caseSensitive?: boolean
  /** Include path matching (default: true) */
  includePathMatching?: boolean
}

/**
 * Filters a JSON object/array recursively based on a search term.
 * 
 * @param data - The JSON data to filter (object, array, or primitive)
 * @param searchTerm - The term to search for
 * @param options - Optional filtering configuration
 * @returns Filtered data containing only matching parts, or empty object if no matches
 * 
 * @example
 * ```typescript
 * const data = { user: { name: "John", age: 30 }, items: ["apple", "banana"] }
 * const result = filterJsonData(data, "john")
 * // Returns: { user: { name: "John" } }
 * ```
 */
export function filterJsonData(
  data: unknown, 
  searchTerm: string, 
  options: JsonFilterOptions = {}
): object {
  const { caseSensitive = false, includePathMatching = true } = options

  // Handle null/undefined data
  if (data === null || data === undefined) {
    return {}
  }

  // Handle primitive data
  if (typeof data !== 'object') {
    return {}
  }

  if (!searchTerm.trim()) {
    return data as object
  }

  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase()
  const visited = new WeakSet()

  const filterObject = (obj: unknown, path: string = ''): unknown => {
    if (obj === null || obj === undefined) return obj

    // Handle circular references
    if (typeof obj === 'object' && visited.has(obj as object)) {
      return undefined
    }

    // Normalize strings for comparison
    const normalizeString = (str: string) => caseSensitive ? str : str.toLowerCase()

    // Check if current value matches search term (exclude null values)
    const valueMatches = obj !== null && normalizeString(String(obj)).includes(normalizedSearchTerm)
    const pathMatches = includePathMatching && normalizeString(path).includes(normalizedSearchTerm)

    // Handle primitive values
    if (typeof obj !== 'object') {
      return valueMatches || pathMatches ? obj : undefined
    }

    // Mark as visited for circular reference detection
    visited.add(obj as object)

    // Handle arrays
    if (Array.isArray(obj)) {
      const filteredArray = obj
        .map((item, index) => filterObject(item, `${path}[${index}]`))
        .filter(item => item !== undefined)
      
      return filteredArray.length > 0 || pathMatches ? filteredArray : undefined
    }

    // Handle objects
    const filteredObj: Record<string, unknown> = {}
    let hasMatches = false

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const keyMatches = normalizeString(key).includes(normalizedSearchTerm)
      const newPath = path ? `${path}.${key}` : key
      
      if (keyMatches) {
        // If key matches, include the entire value (excluding null values)
        if (value !== null) {
          filteredObj[key] = value
          hasMatches = true
        }
      } else {
        // Otherwise, recursively filter the value
        const filteredValue = filterObject(value, newPath)
        if (filteredValue !== undefined) {
          filteredObj[key] = filteredValue
          hasMatches = true
        }
      }
    }

    // Clean up visited set
    visited.delete(obj as object)
    
    return hasMatches || pathMatches ? filteredObj : undefined
  }

  // Helper function to remove null values from results (but preserve empty objects/arrays that were explicitly matched)
  const removeNullValues = (obj: unknown, preserveEmpty: boolean = false): unknown => {
    if (obj === null || obj === undefined) return null
    
    if (Array.isArray(obj)) {
      const filtered = obj.map(item => removeNullValues(item, false)).filter(item => item !== null)
      return filtered.length > 0 || preserveEmpty ? filtered : null
    }
    
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== null) {
          const cleanedValue = removeNullValues(value, false)
          if (cleanedValue !== null || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
            cleaned[key] = cleanedValue !== null ? cleanedValue : value
          }
        }
      }
      return Object.keys(cleaned).length > 0 || preserveEmpty ? cleaned : null
    }
    
    return obj
  }

  const result = filterObject(data)
  const cleanedResult = result !== undefined ? removeNullValues(result) : null
  return (cleanedResult !== null ? cleanedResult : {}) as object
}

/**
 * Checks if a JSON structure contains any matches for the given search term.
 * 
 * @param data - The JSON data to search
 * @param searchTerm - The term to search for
 * @param options - Optional search configuration
 * @returns true if any matches are found, false otherwise
 */
export function hasJsonMatches(
  data: unknown, 
  searchTerm: string, 
  options: JsonFilterOptions = {}
): boolean {
  if (!searchTerm.trim()) return true
  
  const filtered = filterJsonData(data, searchTerm, options)
  return Object.keys(filtered).length > 0
}

/**
 * Counts the number of matches found in a JSON structure.
 * 
 * @param data - The JSON data to search
 * @param searchTerm - The term to search for
 * @param options - Optional search configuration
 * @returns Number of matches found
 */
export function countJsonMatches(
  data: unknown, 
  searchTerm: string, 
  options: JsonFilterOptions = {}
): number {
  if (!searchTerm.trim()) return 0

  const { caseSensitive = false, includePathMatching = true } = options
  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase()
  const visited = new WeakSet()
  
  let count = 0

  const countInObject = (obj: unknown, path: string = ''): void => {
    if (obj === null || obj === undefined) return

    // Handle circular references
    if (typeof obj === 'object' && visited.has(obj as object)) {
      return
    }

    const normalizeString = (str: string) => caseSensitive ? str : str.toLowerCase()
    
    // Check value match (only for primitives to avoid double counting, exclude null values)
    if (typeof obj !== 'object' && obj !== null && normalizeString(String(obj)).includes(normalizedSearchTerm)) {
      count++
    }

    // Check path match
    if (includePathMatching && path && normalizeString(path).includes(normalizedSearchTerm)) {
      count++
    }

    if (typeof obj === 'object') {
      visited.add(obj as object)
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          countInObject(item, `${path}[${index}]`)
        })
      } else {
        Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
          // Check key match
          if (normalizeString(key).includes(normalizedSearchTerm)) {
            count++
          }
          
          const newPath = path ? `${path}.${key}` : key
          countInObject(value, newPath)
        })
      }
      
      visited.delete(obj as object)
    }
  }

  countInObject(data)
  return count
}