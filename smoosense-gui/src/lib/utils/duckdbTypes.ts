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
  const isArray = upperType.endsWith('[]')

  const normalizedType = normalizeType(type)

  const isInteger = DUCKDB_TYPES.INTEGER.includes(normalizedType)
  const isFloat = DUCKDB_TYPES.FLOAT.includes(normalizedType)
  const isString = DUCKDB_TYPES.STRING.includes(normalizedType)
  const isBoolean = DUCKDB_TYPES.BOOLEAN.includes(normalizedType)
  const isDatetime = DUCKDB_TYPES.DATETIME.includes(normalizedType)

  const isNumeric = isInteger || isFloat
  const isPrimitive = isNumeric || isBoolean || isString || isDatetime

  // isNumericArray is true if type ends with [] and base type (without []) is numeric
  const baseType = isArray ? upperType.slice(0, -2) : upperType
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
 * Export the type constants for external use
 */
export { DUCKDB_TYPES }