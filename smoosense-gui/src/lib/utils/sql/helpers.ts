
import { isNil } from 'lodash'

/**
 * Sanitize SQL values for safe query construction
 */
export const sanitizeValue = (value: unknown): string => {
  if (isNil(value)) {
    return 'NULL'
  } else if (typeof value === 'string') {
    // Escape single quotes by doubling them (SQL standard)
    const escaped = value.replace(/'/g, "''")
    return `'${escaped}'`
  } else if (typeof value === 'number') {
    return `${value}`
  } else if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  } else if (Array.isArray(value)) {
    return '(' + value.map(sanitizeValue).join(',') + ')'
  } else {
    throw new Error(`Unknown value type: ${typeof value}`)
  }
}

/**
 * Sanitize SQL column names for safe query construction
 */
export const sanitizeName = (name: unknown): string => {
  if (isNil(name)) {
    return 'NULL'
  } else if (typeof name !== 'string') {
    throw new Error(`Expecting a string for name, but got ${typeof name}: ${name}`)
  } else {
    const trimmed = name.trim()
    if (trimmed === '') {
      throw new Error('Empty name')
    } else if (!trimmed.includes('.')) {
      // Always wrap column name with double quotes since column name main contain space and conflict with SQL keywords
      return `"${trimmed}"`
    } else {
      return trimmed.split('.').map(sanitizeName).join('.')
    }
  }
}