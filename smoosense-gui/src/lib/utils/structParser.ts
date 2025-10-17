import { computeTypeShortcuts } from '@/lib/utils/duckdbTypes';

export interface StructField {
  name: string
  type: string
  isPrimitive: boolean
  children?: StructField[]
}

export interface FlattenedColumn {
  column_name: string
  duckdbType: string
}

/**
 * Check if a DuckDB type is primitive (not a struct, list, or map)
 */
function isPrimitiveType(type: string): boolean {
  const trimmedType = type.trim().toUpperCase()
  
  // Not primitive if it contains STRUCT, LIST, MAP, ARRAY
  if (/(STRUCT|LIST|MAP|ARRAY)\s*\(/i.test(trimmedType)) {
    return false
  }
  return computeTypeShortcuts(trimmedType).isPrimitive;
}

/**
 * Check if a string contains spaces (used to validate field names)
 */
function hasSpaces(str: string): boolean {
  return /\s/.test(str)
}

/**
 * Parse a struct type string and return the parsed fields
 * Example: STRUCT("day" BIGINT, day_name VARCHAR, "hour" BIGINT)
 */
export function parseStructType(structTypeString: string): StructField[] {
  const trimmed = structTypeString.trim()
  
  // Check if it starts with STRUCT
  if (!trimmed.toUpperCase().startsWith('STRUCT')) {
    throw new Error('Invalid struct type: must start with STRUCT')
  }
  
  // Extract the content inside parentheses
  const match = trimmed.match(/^STRUCT\s*\((.+)\)$/i)
  if (!match) {
    throw new Error('Invalid struct format: missing or malformed parentheses')
  }
  
  const fieldsString = match[1]
  return parseFieldList(fieldsString)
}

/**
 * Parse a comma-separated list of field definitions
 */
function parseFieldList(fieldsString: string): StructField[] {
  const fields: StructField[] = []
  let currentPos = 0
  
  while (currentPos < fieldsString.length) {
    const field = parseNextField(fieldsString, currentPos)
    if (field) {
      fields.push(field.field)
      currentPos = field.nextPos
      
      // Skip comma and whitespace
      while (currentPos < fieldsString.length && /[,\s]/.test(fieldsString[currentPos])) {
        currentPos++
      }
    } else {
      break
    }
  }
  
  return fields
}

/**
 * Parse a single field definition starting at the given position
 */
function parseNextField(str: string, startPos: number): { field: StructField; nextPos: number } | null {
  let pos = startPos
  
  // Skip whitespace
  while (pos < str.length && /\s/.test(str[pos])) {
    pos++
  }
  
  if (pos >= str.length) return null
  
  // Parse field name (may be quoted)
  let fieldName = ''
  if (str[pos] === '"') {
    // Quoted field name
    pos++ // Skip opening quote
    while (pos < str.length && str[pos] !== '"') {
      fieldName += str[pos]
      pos++
    }
    if (pos < str.length) pos++ // Skip closing quote
  } else {
    // Unquoted field name
    while (pos < str.length && !/[\s,()]/.test(str[pos])) {
      fieldName += str[pos]
      pos++
    }
  }
  
  // Skip whitespace
  while (pos < str.length && /\s/.test(str[pos])) {
    pos++
  }
  
  // Parse field type
  const typeResult = parseFieldType(str, pos)
  if (!typeResult) {
    throw new Error(`Failed to parse field type for field: ${fieldName}`)
  }
  
  const field: StructField = {
    name: fieldName,
    type: typeResult.type,
    isPrimitive: isPrimitiveType(typeResult.type),
    children: typeResult.children
  }
  
  return {
    field,
    nextPos: typeResult.nextPos
  }
}

/**
 * Parse a field type (which may be primitive or complex like nested STRUCT)
 */
function parseFieldType(str: string, startPos: number): { type: string; nextPos: number; children?: StructField[] } | null {
  let pos = startPos
  
  // Skip whitespace
  while (pos < str.length && /\s/.test(str[pos])) {
    pos++
  }
  
  if (pos >= str.length) return null
  
  // Check if it's a STRUCT type
  if (str.substring(pos).toUpperCase().startsWith('STRUCT')) {
    // Parse nested struct
    const structStart = pos
    pos += 6 // Skip "STRUCT"
    
    // Skip whitespace
    while (pos < str.length && /\s/.test(str[pos])) {
      pos++
    }
    
    if (pos >= str.length || str[pos] !== '(') {
      throw new Error('Expected opening parenthesis after STRUCT')
    }
    
    // Find matching closing parenthesis
    let parenCount = 0
    let structEnd = pos
    
    while (structEnd < str.length) {
      if (str[structEnd] === '(') parenCount++
      else if (str[structEnd] === ')') parenCount--
      
      structEnd++
      if (parenCount === 0) break
    }
    
    const structTypeString = str.substring(structStart, structEnd)
    const children = parseStructType(structTypeString)
    
    return {
      type: structTypeString,
      nextPos: structEnd,
      children
    }
  } else {
    // Parse primitive type
    let type = ''
    
    // Handle types with parentheses like VARCHAR(255) or DECIMAL(10,2)
    let parenCount = 0
    while (pos < str.length) {
      const char = str[pos]
      
      if (char === '(') {
        parenCount++
        type += char
      } else if (char === ')') {
        parenCount--
        type += char
        if (parenCount === 0) {
          pos++
          break
        }
      } else if (parenCount === 0 && /[,)]/.test(char)) {
        // End of type (reached comma or closing paren at top level)
        break
      } else {
        type += char
      }
      
      pos++
    }
    
    return {
      type: type.trim(),
      nextPos: pos
    }
  }
}

/**
 * Flatten struct fields into individual columns with dot notation
 * Only includes fields that meet the criteria:
 * 1. No spaces in column or field names
 * 2. Field is primitive type (no nested structs, lists, or maps)
 */
export function flattenStructFields(
  columnName: string, 
  structType: string
): FlattenedColumn[] {
  // Skip if column name has spaces
  if (hasSpaces(columnName)) {
    return []
  }
  
  try {
    const fields = parseStructType(structType)
    return flattenFields(columnName, fields)
  } catch (error) {
    // Failed to parse struct type for column ${columnName}
      console.error(error)
    return []
  }
}

/**
 * Recursively flatten struct fields
 */
function flattenFields(prefix: string, fields: StructField[]): FlattenedColumn[] {
  const result: FlattenedColumn[] = []
  
  for (const field of fields) {
    // Skip if field name has spaces
    if (hasSpaces(field.name)) {
      continue
    }
    
    const fullName = `${prefix}.${field.name}`
    
    if (field.isPrimitive) {
      // Add primitive field
      result.push({
        column_name: fullName,
        duckdbType: field.type
      })
    } else if (field.children) {
      // Recursively flatten nested struct
      result.push(...flattenFields(fullName, field.children))
    }
  }
  
  return result
}

/**
 * Check if a DuckDB type is a struct type
 */
export function isStructType(type: string): boolean {
  const trimmed = type.trim().toUpperCase()
  return trimmed.startsWith('STRUCT') && !trimmed.endsWith('[]')
}