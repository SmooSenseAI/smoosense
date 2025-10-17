import { sanitizeName, sanitizeValue } from '../helpers'

describe('sanitizeName', () => {
  describe('should handle missing values', () => {
    it('should return NULL for null', () => {
      expect(sanitizeName(null)).toBe('NULL')
    })

    it('should return NULL for undefined', () => {
      expect(sanitizeName(undefined)).toBe('NULL')
    })
  })

  describe('should handle non-string values', () => {
    it('should throw error for non-string types', () => {
      expect(() => sanitizeName(123)).toThrow('Expecting a string for name, but got number: 123')
      expect(() => sanitizeName(true)).toThrow('Expecting a string for name, but got boolean: true')
      expect(() => sanitizeName({})).toThrow('Expecting a string for name, but got object: [object Object]')
      expect(() => sanitizeName([])).toThrow('Expecting a string for name, but got object')
    })
  })

  describe('should handle names without spaces', () => {
    it('should return simple column names unchanged', () => {
      expect(sanitizeName('column_name')).toBe('column_name')
      expect(sanitizeName('id')).toBe('id')
      expect(sanitizeName('user_id')).toBe('user_id')
    })

    it('should return table.column format unchanged when no spaces', () => {
      expect(sanitizeName('table.column')).toBe('table.column')
      expect(sanitizeName('schema.table.column')).toBe('schema.table.column')
    })

    it('should handle empty string', () => {
      expect(() => sanitizeName('')).toThrow('Empty name')
    })

    it('should handle special characters without spaces', () => {
      expect(sanitizeName('column_123')).toBe('column_123')
      expect(sanitizeName('$column')).toBe('"$column"')
      expect(sanitizeName('column#1')).toBe('"column#1"')
    })
  })

  describe('should handle names with spaces', () => {
    it('should quote simple column names with spaces', () => {
      expect(sanitizeName('column name')).toBe('"column name"')
      expect(sanitizeName('user first name')).toBe('"user first name"')
    })

    it('should quote each part of dotted names with spaces', () => {
      expect(sanitizeName('table name.column name')).toBe('"table name"."column name"')
      expect(sanitizeName('my table.user id')).toBe('"my table"."user id"')
    })

    it('should handle mixed scenarios in dotted names', () => {
      // Only first part has space
      expect(sanitizeName('table name.column')).toBe('"table name".column')
      // Only second part has space
      expect(sanitizeName('table.column name')).toBe('table."column name"')
      // Both parts have spaces
      expect(sanitizeName('my table.my column')).toBe('"my table"."my column"')
    })

    it('should handle multiple dots with spaces', () => {
      expect(sanitizeName('schema name.table name.column name')).toBe('"schema name"."table name"."column name"')
      expect(sanitizeName('db.table name.column')).toBe('db."table name".column')
    })

    it('should handle names with only spaces', () => {
      expect(() => sanitizeName(' ')).toThrow('Empty name')
      expect(() => sanitizeName('   ')).toThrow('Empty name')
    })

    it('should handle names with leading/trailing spaces', () => {
      expect(sanitizeName(' column ')).toBe('column')
      expect(sanitizeName('table. column ')).toBe('table.column')
    })
  })

  describe('edge cases', () => {
    it('should handle names with multiple consecutive spaces', () => {
      expect(sanitizeName('column  name')).toBe('"column  name"')
      expect(sanitizeName('table.column  name')).toBe('table."column  name"')
    })

    it('should handle names with dots and spaces combined', () => {
      expect(sanitizeName('table.column.with space')).toBe('table.column."with space"')
      expect(sanitizeName('table with space.column.name')).toBe('"table with space".column.name')
    })

    it('should handle names starting or ending with dots', () => {
      expect(() => sanitizeName('.column')).toThrow('Empty name')
      expect(() => sanitizeName('column.')).toThrow('Empty name')
      expect(() => sanitizeName('.column name')).toThrow('Empty name')
    })

    it('should handle consecutive dots', () => {
      expect(() => sanitizeName('table..column')).toThrow('Empty name')
      expect(() => sanitizeName('table..column name')).toThrow('Empty name')
    })
  })
})

describe('sanitizeValue', () => {
  it('should wrap string values in single quotes', () => {
    expect(sanitizeValue('hello')).toBe("'hello'")
    expect(sanitizeValue('test value')).toBe("'test value'")
    expect(sanitizeValue('')).toBe("''")
  })

  it('should convert number values to string without quotes', () => {
    expect(sanitizeValue(123)).toBe('123')
    expect(sanitizeValue(0)).toBe('0')
    expect(sanitizeValue(-456)).toBe('-456')
    expect(sanitizeValue(3.14)).toBe('3.14')
  })

  it('should convert boolean values to SQL boolean literals', () => {
    expect(sanitizeValue(true)).toBe('TRUE')
    expect(sanitizeValue(false)).toBe('FALSE')
  })

  it('should convert null and undefined to NULL', () => {
    expect(sanitizeValue(null)).toBe('NULL')
    expect(sanitizeValue(undefined)).toBe('NULL')
  })

  it('should handle arrays recursively', () => {
    expect(sanitizeValue([1, 2, 3])).toBe('(1,2,3)')
    expect(sanitizeValue(['1', '2', '3'])).toBe("('1','2','3')")
    expect(sanitizeValue([true, false])).toBe('(TRUE,FALSE)')
    expect(sanitizeValue([null, undefined])).toBe('(NULL,NULL)')
    expect(sanitizeValue([])).toBe('()')
  })

  it('should handle nested arrays', () => {
    expect(sanitizeValue([[1, 2], [3, 4]])).toBe('((1,2),(3,4))')
    expect(sanitizeValue([['a', 'b'], ['c', 'd']])).toBe("(('a','b'),('c','d'))")
  })

  it('should throw error for unsupported types', () => {
    expect(() => sanitizeValue({})).toThrow('Unknown value type: object')
    expect(() => sanitizeValue(new Date())).toThrow('Unknown value type: object')
    expect(() => sanitizeValue(/regex/)).toThrow('Unknown value type: object')
    expect(() => sanitizeValue(() => {})).toThrow('Unknown value type: function')
  })

  it('should handle mixed array types', () => {
    expect(sanitizeValue(['text', 123, true, null])).toBe("('text',123,TRUE,NULL)")
    expect(sanitizeValue([0, false, ''])).toBe("(0,FALSE,'')")
  })
})