import {
  parseStructType,
  flattenStructFields,
  isStructType,
} from '../structParser'

describe('structParser', () => {
  describe('isStructType', () => {
    it('should identify struct types', () => {
      expect(isStructType('STRUCT("day" BIGINT, "month" VARCHAR)')).toBe(true)
      expect(isStructType('struct(field1 INTEGER, field2 TEXT)')).toBe(true)
      expect(isStructType('  STRUCT(x INT)  ')).toBe(true)
    })

    it('should identify non-struct types', () => {
      expect(isStructType('VARCHAR')).toBe(false)
      expect(isStructType('INTEGER')).toBe(false)
      expect(isStructType('DECIMAL(10,2)')).toBe(false)
      expect(isStructType('LIST(INTEGER)')).toBe(false)
    })

    it('should identify arrays of structs as non-struct types', () => {
      expect(isStructType('STRUCT(bbox DOUBLE[], "label" VARCHAR)[]')).toBe(false)
      expect(isStructType('STRUCT(field1 INTEGER, field2 TEXT)[]')).toBe(false)
      expect(isStructType('  STRUCT(x INT)[]  ')).toBe(false)
    })
  })

  describe('parseStructType', () => {
    it('should parse simple struct with quoted field names', () => {
      const result = parseStructType('STRUCT("day" BIGINT, "hour" INTEGER)')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'day',
        type: 'BIGINT',
        isPrimitive: true
      })
      expect(result[1]).toEqual({
        name: 'hour',
        type: 'INTEGER',
        isPrimitive: true
      })
    })

    it('should parse simple struct with unquoted field names', () => {
      const result = parseStructType('STRUCT(day_name VARCHAR, hour_val INTEGER)')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'day_name',
        type: 'VARCHAR',
        isPrimitive: true
      })
      expect(result[1]).toEqual({
        name: 'hour_val',
        type: 'INTEGER',
        isPrimitive: true
      })
    })

    it('should parse struct with mixed quoted and unquoted field names', () => {
      const result = parseStructType('STRUCT("day" BIGINT, day_name VARCHAR, "hour" BIGINT)')
      
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('day')
      expect(result[1].name).toBe('day_name')
      expect(result[2].name).toBe('hour')
    })

    it('should parse struct with complex types', () => {
      const result = parseStructType('STRUCT(id INTEGER, name VARCHAR(255), balance DECIMAL(10,2))')
      
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        name: 'id',
        type: 'INTEGER',
        isPrimitive: true
      })
      expect(result[1]).toEqual({
        name: 'name',
        type: 'VARCHAR(255)',
        isPrimitive: true
      })
      expect(result[2]).toEqual({
        name: 'balance',
        type: 'DECIMAL(10,2)',
        isPrimitive: true
      })
    })

    it('should parse nested struct', () => {
      const result = parseStructType('STRUCT(id INTEGER, address STRUCT(street VARCHAR, city VARCHAR))')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'id',
        type: 'INTEGER',
        isPrimitive: true
      })
      expect(result[1]).toEqual({
        name: 'address',
        type: 'STRUCT(street VARCHAR, city VARCHAR)',
        isPrimitive: false,
        children: [
          {
            name: 'street',
            type: 'VARCHAR',
            isPrimitive: true
          },
          {
            name: 'city',
            type: 'VARCHAR',
            isPrimitive: true
          }
        ]
      })
    })

    it('should parse deeply nested struct', () => {
      const result = parseStructType('STRUCT(id INTEGER, person STRUCT(name VARCHAR, address STRUCT(street VARCHAR, zipcode INTEGER)))')
      
      expect(result).toHaveLength(2)
      const person = result[1]
      expect(person.name).toBe('person')
      expect(person.isPrimitive).toBe(false)
      expect(person.children).toHaveLength(2)
      
      const address = person.children![1]
      expect(address.name).toBe('address')
      expect(address.isPrimitive).toBe(false)
      expect(address.children).toHaveLength(2)
      expect(address.children![0].name).toBe('street')
      expect(address.children![1].name).toBe('zipcode')
    })

    it('should handle whitespace variations', () => {
      const result = parseStructType('  STRUCT  (  "day"   BIGINT  ,   "hour"   INTEGER  )  ')
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('day')
      expect(result[1].name).toBe('hour')
    })

    it('should throw error for invalid struct format', () => {
      expect(() => parseStructType('INTEGER')).toThrow('Invalid struct type: must start with STRUCT')
      expect(() => parseStructType('STRUCT')).toThrow('Invalid struct format: missing or malformed parentheses')
      expect(() => parseStructType('STRUCT(')).toThrow('Invalid struct format: missing or malformed parentheses')
      expect(() => parseStructType('STRUCT(field')).toThrow('Invalid struct format: missing or malformed parentheses')
    })

    it('should handle complex real-world example', () => {
      const complexStruct = 'STRUCT("day" BIGINT, day_name VARCHAR, "hour" BIGINT, "minute" BIGINT, "month" BIGINT, "year" BIGINT)'
      const result = parseStructType(complexStruct)
      
      expect(result).toHaveLength(6)
      expect(result.map(f => f.name)).toEqual(['day', 'day_name', 'hour', 'minute', 'month', 'year'])
      expect(result.every(f => f.isPrimitive)).toBe(true)
    })
  })

  describe('flattenStructFields', () => {
    it('should flatten simple struct fields', () => {
      const result = flattenStructFields('timestamp_parts', 'STRUCT("day" BIGINT, "hour" INTEGER, day_name VARCHAR)')
      
      expect(result).toHaveLength(3)
      expect(result).toEqual([
        { column_name: 'timestamp_parts.day', duckdbType: 'BIGINT' },
        { column_name: 'timestamp_parts.hour', duckdbType: 'INTEGER' },
        { column_name: 'timestamp_parts.day_name', duckdbType: 'VARCHAR' }
      ])
    })

    it('should flatten nested struct fields', () => {
      const result = flattenStructFields('user', 'STRUCT(id INTEGER, address STRUCT(street VARCHAR, zipcode INTEGER))')
      
      expect(result).toHaveLength(3)
      expect(result).toEqual([
        { column_name: 'user.id', duckdbType: 'INTEGER' },
        { column_name: 'user.address.street', duckdbType: 'VARCHAR' },
        { column_name: 'user.address.zipcode', duckdbType: 'INTEGER' }
      ])
    })

    it('should skip fields with spaces in names', () => {
      const result = flattenStructFields('data', 'STRUCT("field name" VARCHAR, valid_field INTEGER)')
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        column_name: 'data.valid_field',
        duckdbType: 'INTEGER'
      })
    })

    it('should skip columns with spaces in column names', () => {
      const result = flattenStructFields('column name', 'STRUCT(field INTEGER)')
      
      expect(result).toHaveLength(0)
    })

    it('should skip non-primitive fields', () => {
      const result = flattenStructFields('data', 'STRUCT(primitive_field INTEGER, list_field LIST(INTEGER), struct_field STRUCT(x INTEGER))')
      
      expect(result).toHaveLength(2)
      expect(result).toEqual([
        { column_name: 'data.primitive_field', duckdbType: 'INTEGER' },
        { column_name: 'data.struct_field.x', duckdbType: 'INTEGER' }
      ])
    })

    it('should handle deeply nested structures', () => {
      const result = flattenStructFields(
        'complex', 
        'STRUCT(id INTEGER, person STRUCT(name VARCHAR, contact STRUCT(email VARCHAR, phone VARCHAR)))'
      )
      
      expect(result).toHaveLength(4)
      expect(result).toEqual([
        { column_name: 'complex.id', duckdbType: 'INTEGER' },
        { column_name: 'complex.person.name', duckdbType: 'VARCHAR' },
        { column_name: 'complex.person.contact.email', duckdbType: 'VARCHAR' },
        { column_name: 'complex.person.contact.phone', duckdbType: 'VARCHAR' }
      ])
    })

    it('should return empty array for invalid struct types', () => {
      // Mock console.warn to avoid noise in test output

      const result = flattenStructFields('data', 'INVALID_STRUCT')
      expect(result).toHaveLength(0)

    })

    it('should handle empty struct', () => {
      const result = flattenStructFields('data', 'STRUCT()')
      expect(result).toHaveLength(0)
    })

    it('should handle complex types within struct', () => {
      const result = flattenStructFields(
        'data', 
        'STRUCT(name VARCHAR(255), balance DECIMAL(10,2), created_at TIMESTAMP)'
      )
      
      expect(result).toHaveLength(3)
      expect(result).toEqual([
        { column_name: 'data.name', duckdbType: 'VARCHAR(255)' },
        { column_name: 'data.balance', duckdbType: 'DECIMAL(10,2)' },
        { column_name: 'data.created_at', duckdbType: 'TIMESTAMP' }
      ])
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle struct with only truly non-primitive fields', () => {
      const result = flattenStructFields('data', 'STRUCT(list_field LIST(INTEGER), map_field MAP(VARCHAR, INTEGER))')
      expect(result).toHaveLength(0)
    })
    
    it('should include nested struct fields that are primitive', () => {
      const result = flattenStructFields('data', 'STRUCT(list_field LIST(INTEGER), nested STRUCT(valid_field VARCHAR))')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        column_name: 'data.nested.valid_field',
        duckdbType: 'VARCHAR'
      })
    })

    it('should handle mixed valid and invalid field names', () => {
      const result = flattenStructFields('data', 'STRUCT("field with spaces" VARCHAR, valid_field INTEGER, "another space field" BIGINT, also_valid VARCHAR)')
      
      expect(result).toHaveLength(2)
      expect(result.map(r => r.column_name)).toEqual(['data.valid_field', 'data.also_valid'])
    })

    it('should preserve original type information', () => {
      const result = flattenStructFields('user', 'STRUCT(balance DECIMAL(10,2), name VARCHAR(255))')
      
      expect(result[0].duckdbType).toBe('DECIMAL(10,2)')
      expect(result[1].duckdbType).toBe('VARCHAR(255)')
    })
  })
})