/**
 * Column name utilities and constants
 */

/**
 * Invalid column name placeholder used in React hooks to maintain hooks rules compliance.
 * 
 * This constant is used when a column name is empty, null, or invalid to ensure:
 * 1. React hooks are always called in the same order (cannot use early returns)
 * 2. Redux state selectors don't break with undefined keys
 * 3. Query builders can validate against this known invalid value
 * 4. Clear debugging when invalid column names are processed
 * 
 * @see isValidColumnName - Use this function to validate column names
 * @see getSafeColumnName - Use this function to get a safe column name for hooks
 */
export const INVALID_COLUMN_NAME = '__INVALID__' as const

/**
 * Validates if a column name is valid (not empty, null, undefined, or whitespace-only).
 * 
 * @param columnName - The column name to validate
 * @returns true if the column name is valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidColumnName('age') // true
 * isValidColumnName('') // false
 * isValidColumnName('  ') // false
 * isValidColumnName(null) // false
 * isValidColumnName(undefined) // false
 * ```
 */
export function isValidColumnName(columnName: string | null | undefined): boolean {
  return !!(columnName && columnName.trim() !== '')
}

/**
 * Returns a safe column name for use with React hooks and Redux selectors.
 * If the column name is invalid, returns INVALID_COLUMN_NAME constant.
 * 
 * This function ensures React hooks can always be called with a valid string key,
 * preventing hooks rules violations and Redux selector errors.
 * 
 * @param columnName - The column name to make safe
 * @returns The original column name if valid, or INVALID_COLUMN_NAME if invalid
 * 
 * @example
 * ```typescript
 * getSafeColumnName('age') // 'age'
 * getSafeColumnName('') // '__INVALID__'
 * getSafeColumnName('  ') // '__INVALID__'
 * getSafeColumnName(null) // '__INVALID__'
 * 
 * // Usage in hooks
 * const safeColumnName = getSafeColumnName(columnName)
 * const columnState = useAppSelector(state => state.columns.baseStats[safeColumnName])
 * ```
 */
export function getSafeColumnName(columnName: string | null | undefined): string {
  return isValidColumnName(columnName) ? columnName! : INVALID_COLUMN_NAME
}