/**
 * DuckDB type categories for classification
 */
const DUCKDB_TYPES = {
  INTEGER: ['TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'HUGEINT',
    'UTINYINT', 'USMALLINT', 'UINTEGER', 'UBIGINT'],
  BOOLEAN: ['BOOLEAN'],
  FLOAT: ['FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'],
  STRING: ['VARCHAR', 'CHAR', 'STRING', 'TEXT', 'BINARY'],
  DATETIME: ['TIMESTAMP', 'DATE', 'TIME', 'TIMESTAMP_NS'],
}

/**
 * Normalizes a DuckDB type string to uppercase and handles complex types
 * @param type - The raw type string from DuckDB
 * @returns Normalized type string
 */
function normalizeType(type: string): string {
  if (!type) return ''
  
  // Convert to uppercase and extract base type
  const upperType = type.toString().toUpperCase().trim()
  
  // Handle complex types like VARCHAR(255), DECIMAL(10,2), etc.
  // Split on parentheses first to remove parameters
  const withoutParams = upperType.split('(')[0]
  
  // Handle complex types like "TIMESTAMP WITH TIME ZONE" -> "TIMESTAMP"
  // Take just the first word for base type
  const baseType = withoutParams.split(' ')[0]
  
  return baseType
}

/**
 * Type shortcuts computed from DuckDB type classification
 */
export interface TypeShortcuts {
  /** True if the type is an integer type */
  isInteger: boolean
  /** True if the type is a floating point type */
  isFloat: boolean
  /** True if the type is numeric (integer or float) */
  isNumeric: boolean
  /** True if the type is boolean */
  isBoolean: boolean
  /** True if the type is a string type */
  isString: boolean
  /** True if the type is a primitive (numeric, boolean, or string) */
  isPrimitive: boolean
  /** AG Grid compatible type classification */
  agType: 'number' | 'boolean' | 'dateString' | 'text'
  /** True if the type is a datetime type */
  isDatetime: boolean
  /** True if the type is a numeric array (ends with [] and base type is numeric) */
  isNumericArray: boolean
  /** True if the type is an array type (ends with []) */
  isArray: boolean
  /** Embedding dimension for fixed-size float/double arrays, null otherwise */
  embDim: number | null
}

/**
 * Computes type shortcuts for a given DuckDB type
 * @param type - The DuckDB type string
 * @returns Object with boolean flags and AG Grid type classification
 * 
 * @example
 * ```typescript
 * const shortcuts = computeTypeShortcuts('INTEGER')
 * // Returns: { isInteger: true, isNumeric: true, agType: 'number', ... }
 * 
 * const shortcuts2 = computeTypeShortcuts('VARCHAR(255)')
 * // Returns: { isString: true, isPrimitive: true, agType: 'text', ... }
 * ```
 */
export function computeTypeShortcuts(type: string): TypeShortcuts {
  const upperType = type.toString().toUpperCase().trim()

  // Check for array types: TYPE[] (variable-size) or TYPE[n] (fixed-size)
  // Match patterns like FLOAT[], FLOAT[32], INTEGER[], etc.
  const arrayMatch = upperType.match(/^(.+)\[(\d*)\]$/)
  const isArray = arrayMatch !== null

  const normalizedType = normalizeType(type)

  const isInteger = DUCKDB_TYPES.INTEGER.includes(normalizedType)
  const isFloat = DUCKDB_TYPES.FLOAT.includes(normalizedType)
  const isString = DUCKDB_TYPES.STRING.includes(normalizedType)
  const isBoolean = DUCKDB_TYPES.BOOLEAN.includes(normalizedType)
  const isDatetime = DUCKDB_TYPES.DATETIME.includes(normalizedType)

  const isNumeric = isInteger || isFloat
  const isPrimitive = isNumeric || isBoolean || isString || isDatetime

  // isNumericArray is true if type is an array and base type is numeric
  const baseType = arrayMatch ? arrayMatch[1] : upperType
  const normalizedBaseType = normalizeType(baseType)
  const baseIsInteger = DUCKDB_TYPES.INTEGER.includes(normalizedBaseType)
  const baseIsFloat = DUCKDB_TYPES.FLOAT.includes(normalizedBaseType)
  const isNumericArray = isArray && (baseIsInteger || baseIsFloat)

  // AG Grid type classification
  const agType: TypeShortcuts['agType'] =
    isNumeric ? 'number' :
    isBoolean ? 'boolean' :
    isDatetime ? 'dateString' :
    'text'

  // embDim: dimension of fixed-size float/double arrays (for embeddings)
  // Only set for fixed-size arrays with float/double base type
  const arrayDimStr = arrayMatch ? arrayMatch[2] : ''
  const embDim = (isNumericArray && baseIsFloat && arrayDimStr)
    ? parseInt(arrayDimStr, 10)
    : null

  return {
    isInteger,
    isFloat,
    isNumeric,
    isBoolean,
    isString,
    isPrimitive,
    agType,
    isDatetime,
    isNumericArray,
    isArray,
    embDim,
  }
}

/**
 * Gets all DuckDB types in a specific category
 * @param category - The type category to retrieve
 * @returns Array of type names in that category
 */
export function getTypesInCategory(category: keyof typeof DUCKDB_TYPES): string[] {
  return [...DUCKDB_TYPES[category]]
}

/**
 * Checks if a type belongs to a specific category
 * @param type - The DuckDB type to check
 * @param category - The category to check against
 * @returns True if the type belongs to the category
 */
export function isTypeInCategory(type: string, category: keyof typeof DUCKDB_TYPES): boolean {
  const normalizedType = normalizeType(type)
  return DUCKDB_TYPES[category].includes(normalizedType)
}

/**
 * Extracts the array dimension from a fixed-size array type.
 * Returns null for variable-size arrays or non-array types.
 *
 * @param type - The DuckDB type string (e.g., "FLOAT[32]", "INTEGER[]")
 * @returns The array dimension as a number, or null if not a fixed-size array
 *
 * @example
 * ```typescript
 * getArrayDimension('FLOAT[32]')   // Returns 32
 * getArrayDimension('FLOAT[128]')  // Returns 128
 * getArrayDimension('FLOAT[]')     // Returns null (variable-size)
 * getArrayDimension('INTEGER')     // Returns null (not an array)
 * ```
 */
export function getArrayDimension(type: string): number | null {
  if (!type) return null

  const upperType = type.toString().toUpperCase().trim()

  // Match fixed-size array pattern: TYPE[n] where n is a number
  const match = upperType.match(/^.+\[(\d+)\]$/)

  if (match && match[1]) {
    return parseInt(match[1], 10)
  }

  return null
}

/**
 * Export the type constants for external use
 */
export { DUCKDB_TYPES }