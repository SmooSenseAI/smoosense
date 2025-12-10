import {
  computeTypeShortcuts,
  getTypesInCategory,
  isTypeInCategory,
  getArrayDimension,
  DUCKDB_TYPES
} from '../duckdbTypes'

describe('computeTypeShortcuts', () => {
  describe('integer types', () => {
    it('should classify integer types correctly', () => {
      const integerTypes = ['TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'HUGEINT', 'UTINYINT', 'USMALLINT', 'UINTEGER', 'UBIGINT']

      integerTypes.forEach(type => {
        const result = computeTypeShortcuts(type)
        expect(result).toEqual({
          isInteger: true,
          isFloat: false,
          isNumeric: true,
          isBoolean: false,
          isString: false,
          isPrimitive: true,
          agType: 'number',
          isDatetime: false,
          isNumericArray: false,
          isArray: false,
        })
      })
    })

    it('should handle case insensitive integer types', () => {
      const result = computeTypeShortcuts('integer')
      expect(result.isInteger).toBe(true)
      expect(result.agType).toBe('number')
    })
  })

  describe('float types', () => {
    it('should classify float types correctly', () => {
      const floatTypes = ['FLOAT', 'DOUBLE', 'DECIMAL', 'REAL']

      floatTypes.forEach(type => {
        const result = computeTypeShortcuts(type)
        expect(result).toEqual({
          isInteger: false,
          isFloat: true,
          isNumeric: true,
          isBoolean: false,
          isString: false,
          isPrimitive: true,
          agType: 'number',
          isDatetime: false,
          isNumericArray: false,
          isArray: false,
        })
      })
    })

    it('should handle complex float types with parameters', () => {
      const result = computeTypeShortcuts('DECIMAL(10,2)')
      expect(result.isFloat).toBe(true)
      expect(result.isNumeric).toBe(true)
      expect(result.agType).toBe('number')
    })
  })

  describe('string types', () => {
    it('should classify string types correctly', () => {
      const stringTypes = ['VARCHAR', 'CHAR', 'STRING', 'TEXT', 'BINARY']

      stringTypes.forEach(type => {
        const result = computeTypeShortcuts(type)
        expect(result).toEqual({
          isInteger: false,
          isFloat: false,
          isNumeric: false,
          isBoolean: false,
          isString: true,
          isPrimitive: true,
          agType: 'text',
          isDatetime: false,
          isNumericArray: false,
          isArray: false,
        })
      })
    })

    it('should handle string types with parameters', () => {
      const result = computeTypeShortcuts('VARCHAR(255)')
      expect(result.isString).toBe(true)
      expect(result.agType).toBe('text')
    })
  })

  describe('boolean types', () => {
    it('should classify boolean type correctly', () => {
      const result = computeTypeShortcuts('BOOLEAN')
      expect(result).toEqual({
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: true,
        isString: false,
        isPrimitive: true,
        agType: 'boolean',
        isDatetime: false,
        isNumericArray: false,
        isArray: false,
      })
    })
  })

  describe('datetime types', () => {
    it('should classify datetime types correctly', () => {
      const datetimeTypes = ['TIMESTAMP', 'DATE', 'TIME', 'TIMESTAMP_NS']

      datetimeTypes.forEach(type => {
        const result = computeTypeShortcuts(type)
        expect(result).toEqual({
          isInteger: false,
          isFloat: false,
          isNumeric: false,
          isBoolean: false,
          isString: false,
          isPrimitive: true,
          agType: 'dateString',
          isDatetime: true,
          isNumericArray: false,
          isArray: false,
        })
      })
    })
  })

  describe('array types', () => {
    it('should detect variable-size array FLOAT[] as array and numeric array', () => {
      const result = computeTypeShortcuts('FLOAT[]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
      expect(result.isFloat).toBe(false) // The base type flags should be false for arrays
      expect(result.isNumeric).toBe(false)
    })

    it('should detect fixed-size array FLOAT[32] as array and numeric array', () => {
      const result = computeTypeShortcuts('FLOAT[32]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })

    it('should detect variable-size array INTEGER[] as array and numeric array', () => {
      const result = computeTypeShortcuts('INTEGER[]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })

    it('should detect fixed-size array INTEGER[10] as array and numeric array', () => {
      const result = computeTypeShortcuts('INTEGER[10]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })

    it('should detect VARCHAR[] as array but not numeric array', () => {
      const result = computeTypeShortcuts('VARCHAR[]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(false)
    })

    it('should detect VARCHAR[100] as array but not numeric array', () => {
      const result = computeTypeShortcuts('VARCHAR[100]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(false)
    })

    it('should handle lowercase array types', () => {
      const result = computeTypeShortcuts('float[32]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })

    it('should detect DOUBLE[] as array and numeric array', () => {
      const result = computeTypeShortcuts('DOUBLE[]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })

    it('should detect BIGINT[1024] as array and numeric array', () => {
      const result = computeTypeShortcuts('BIGINT[1024]')
      expect(result.isArray).toBe(true)
      expect(result.isNumericArray).toBe(true)
    })
  })

  describe('blob types', () => {
    it('should classify BLOB as non-primitive', () => {
      const result = computeTypeShortcuts('BLOB')
      expect(result).toEqual({
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: false,
        isString: false,
        isPrimitive: false,
        agType: 'text',
        isDatetime: false,
        isNumericArray: false,
        isArray: false,
      })
    })
  })

  describe('unknown types', () => {
    it('should handle unknown types gracefully', () => {
      const result = computeTypeShortcuts('UNKNOWN_TYPE')
      expect(result).toEqual({
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: false,
        isString: false,
        isPrimitive: false,
        agType: 'text',
        isDatetime: false,
        isNumericArray: false,
        isArray: false,
      })
    })

    it('should handle empty type', () => {
      const result = computeTypeShortcuts('')
      expect(result).toEqual({
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: false,
        isString: false,
        isPrimitive: false,
        agType: 'text',
        isDatetime: false,
        isNumericArray: false,
        isArray: false,
      })
    })
  })

  describe('edge cases', () => {
    it('should handle whitespace in types', () => {
      const result = computeTypeShortcuts('  INTEGER  ')
      expect(result.isInteger).toBe(true)
      expect(result.agType).toBe('number')
    })

    it('should handle types with additional parameters', () => {
      const result = computeTypeShortcuts('TIMESTAMP WITH TIME ZONE')
      expect(result.isDatetime).toBe(true)
      expect(result.agType).toBe('dateString')
    })
  })
})

describe('getTypesInCategory', () => {
  it('should return all integer types', () => {
    const integerTypes = getTypesInCategory('INTEGER')
    expect(integerTypes).toEqual(['TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'HUGEINT', 'UTINYINT', 'USMALLINT', 'UINTEGER', 'UBIGINT'])
  })

  it('should return all float types', () => {
    const floatTypes = getTypesInCategory('FLOAT')
    expect(floatTypes).toEqual(['FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'])
  })

  it('should return all string types', () => {
    const stringTypes = getTypesInCategory('STRING')
    expect(stringTypes).toEqual(['VARCHAR', 'CHAR', 'STRING', 'TEXT', 'BINARY'])
  })

  it('should return all boolean types', () => {
    const booleanTypes = getTypesInCategory('BOOLEAN')
    expect(booleanTypes).toEqual(['BOOLEAN'])
  })

  it('should return all datetime types', () => {
    const datetimeTypes = getTypesInCategory('DATETIME')
    expect(datetimeTypes).toEqual(['TIMESTAMP', 'DATE', 'TIME', 'TIMESTAMP_NS'])
  })

  it('should return a copy of the array', () => {
    const integerTypes = getTypesInCategory('INTEGER')
    integerTypes.push('NEW_TYPE')

    // Original should not be modified
    const integerTypes2 = getTypesInCategory('INTEGER')
    expect(integerTypes2).not.toContain('NEW_TYPE')
  })
})

describe('isTypeInCategory', () => {
  it('should correctly identify types in INTEGER category', () => {
    expect(isTypeInCategory('INTEGER', 'INTEGER')).toBe(true)
    expect(isTypeInCategory('BIGINT', 'INTEGER')).toBe(true)
    expect(isTypeInCategory('VARCHAR', 'INTEGER')).toBe(false)
  })

  it('should correctly identify types in FLOAT category', () => {
    expect(isTypeInCategory('FLOAT', 'FLOAT')).toBe(true)
    expect(isTypeInCategory('DECIMAL', 'FLOAT')).toBe(true)
    expect(isTypeInCategory('INTEGER', 'FLOAT')).toBe(false)
  })

  it('should correctly identify types in STRING category', () => {
    expect(isTypeInCategory('VARCHAR', 'STRING')).toBe(true)
    expect(isTypeInCategory('TEXT', 'STRING')).toBe(true)
    expect(isTypeInCategory('BLOB', 'STRING')).toBe(false)
    expect(isTypeInCategory('INTEGER', 'STRING')).toBe(false)
  })

  it('should correctly identify types in BOOLEAN category', () => {
    expect(isTypeInCategory('BOOLEAN', 'BOOLEAN')).toBe(true)
    expect(isTypeInCategory('INTEGER', 'BOOLEAN')).toBe(false)
  })

  it('should correctly identify types in DATETIME category', () => {
    expect(isTypeInCategory('TIMESTAMP', 'DATETIME')).toBe(true)
    expect(isTypeInCategory('DATE', 'DATETIME')).toBe(true)
    expect(isTypeInCategory('INTEGER', 'DATETIME')).toBe(false)
  })

  it('should handle case insensitive types', () => {
    expect(isTypeInCategory('integer', 'INTEGER')).toBe(true)
    expect(isTypeInCategory('varchar', 'STRING')).toBe(true)
  })

  it('should handle types with parameters', () => {
    expect(isTypeInCategory('VARCHAR(255)', 'STRING')).toBe(true)
    expect(isTypeInCategory('DECIMAL(10,2)', 'FLOAT')).toBe(true)
  })
})

describe('DUCKDB_TYPES constant', () => {
  it('should export all type categories', () => {
    expect(DUCKDB_TYPES).toHaveProperty('INTEGER')
    expect(DUCKDB_TYPES).toHaveProperty('BOOLEAN')
    expect(DUCKDB_TYPES).toHaveProperty('FLOAT')
    expect(DUCKDB_TYPES).toHaveProperty('STRING')
    expect(DUCKDB_TYPES).toHaveProperty('DATETIME')
  })

  it('should contain expected number of types in each category', () => {
    expect(DUCKDB_TYPES.INTEGER).toHaveLength(9)
    expect(DUCKDB_TYPES.BOOLEAN).toHaveLength(1)
    expect(DUCKDB_TYPES.FLOAT).toHaveLength(4)
    expect(DUCKDB_TYPES.STRING).toHaveLength(5)
    expect(DUCKDB_TYPES.DATETIME).toHaveLength(4)
  })
})

describe('getArrayDimension', () => {
  it('should return dimension for fixed-size FLOAT arrays', () => {
    expect(getArrayDimension('FLOAT[32]')).toBe(32)
    expect(getArrayDimension('FLOAT[128]')).toBe(128)
    expect(getArrayDimension('FLOAT[1024]')).toBe(1024)
  })

  it('should return dimension for fixed-size INTEGER arrays', () => {
    expect(getArrayDimension('INTEGER[10]')).toBe(10)
    expect(getArrayDimension('BIGINT[256]')).toBe(256)
  })

  it('should return null for variable-size arrays', () => {
    expect(getArrayDimension('FLOAT[]')).toBe(null)
    expect(getArrayDimension('INTEGER[]')).toBe(null)
    expect(getArrayDimension('VARCHAR[]')).toBe(null)
  })

  it('should return null for non-array types', () => {
    expect(getArrayDimension('FLOAT')).toBe(null)
    expect(getArrayDimension('INTEGER')).toBe(null)
    expect(getArrayDimension('VARCHAR')).toBe(null)
    expect(getArrayDimension('VARCHAR(255)')).toBe(null)
  })

  it('should handle lowercase types', () => {
    expect(getArrayDimension('float[32]')).toBe(32)
    expect(getArrayDimension('double[128]')).toBe(128)
  })

  it('should handle empty and null-like inputs', () => {
    expect(getArrayDimension('')).toBe(null)
  })
})
