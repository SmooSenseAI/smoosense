
import { isNil } from 'lodash'

/**
 * Sanitize SQL values for safe query construction
 */
export const sanitizeValue = (value: unknown): string => {
  if (isNil(value)) {
    return 'NULL'
  } else if (typeof value === 'string') {
    return `'${value}'`
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
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      return trimmed
    } else if (!trimmed.includes('.')) {
      return `"${trimmed}"`
    } else {
      return trimmed.split('.').map(sanitizeName).join('.')
    }
  }
}