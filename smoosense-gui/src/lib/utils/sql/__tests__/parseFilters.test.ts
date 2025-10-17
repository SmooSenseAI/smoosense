import { parseFilterItem, toSqlCondition } from '../parseFilters'
import { FilterType } from '@/lib/features/filters/types'
import type { ColumnFilter } from '@/lib/features/colDefs/agSlice'

describe('parseFilterItem | invalid input', () => {
  it('should throw error for unknown filter type', () => {
    expect(() => {
      parseFilterItem('columnName', { 
        filterType: 'invalidType' as never, 
        null: 'N/A' 
      } as ColumnFilter)
    }).toThrow('Unknown filter type: invalidType')
  })

  it('should throw error for missing null filter', () => {
    expect(() => {
      parseFilterItem('columnName', { 
        filterType: FilterType.TEXT, 
        contains: 'value' 
      } as ColumnFilter)
    }).toThrow('Null filter is required for columnName')
  })

  it('should throw error for unknown null filter', () => {
    expect(() => {
      parseFilterItem('columnName', { 
        filterType: FilterType.TEXT, 
        contains: 'value', 
        null: 'unknown' as never 
      })
    }).toThrow('Unknown null filter: unknown')
  })
})

describe('parseFilterItem | TEXT filter', () => {
  it('should return a filter expression for non-empty contains', () => {
    const baseExpr = `CAST(columnName AS VARCHAR) LIKE '%value%'`
    
    const testCases = [
      { nullFilter: 'N/A' as const, expected: baseExpr },
      { nullFilter: 'Include' as const, expected: `${baseExpr} OR columnName IS NULL` },
      { nullFilter: 'Exclude' as const, expected: baseExpr },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.TEXT,
        contains: 'value',
        null: nullFilter
      })).toBe(expected)
    })
  })

  it('should handle empty or missing contains', () => {
    const testCases = [
      { nullFilter: 'N/A' as const, expected: null },
      { nullFilter: 'Include' as const, expected: null },
      { nullFilter: 'Exclude' as const, expected: `columnName IS NOT NULL` },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      // Test with empty contains
      expect(parseFilterItem('columnName', {
        filterType: FilterType.TEXT,
        contains: '',
        null: nullFilter
      })).toBe(expected)

      // Test with missing contains
      expect(parseFilterItem('columnName', {
        filterType: FilterType.TEXT,
        null: nullFilter
      } as ColumnFilter)).toBe(expected)
    })
  })
})

describe('parseFilterItem | ENUM filter', () => {
  it('should return a filter expression for non-empty string values in including', () => {
    const including = ['value1', 'value2']
    const baseExpr = `columnName IN ('value1','value2')`
    
    const testCases = [
      { nullFilter: 'N/A' as const, expected: baseExpr },
      { nullFilter: 'Include' as const, expected: `${baseExpr} OR columnName IS NULL` },
      { nullFilter: 'Exclude' as const, expected: baseExpr },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.ENUM,
        including,
        null: nullFilter
      })).toBe(expected)
    })
  })

  it('should return a filter expression for non-empty number values in including', () => {
    const including = ['18', '42'] // Note: including is string[] in our type definition
    const baseExpr = `columnName IN ('18','42')`
    
    const testCases = [
      { nullFilter: 'N/A' as const, expected: baseExpr },
      { nullFilter: 'Include' as const, expected: `${baseExpr} OR columnName IS NULL` },
      { nullFilter: 'Exclude' as const, expected: baseExpr },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.ENUM,
        including,
        null: nullFilter
      })).toBe(expected)
    })
  })

  it('should handle empty or missing including', () => {
    const testCases = [
      { nullFilter: 'N/A' as const, expected: null },
      { nullFilter: 'Include' as const, expected: null },
      { nullFilter: 'Exclude' as const, expected: `columnName IS NOT NULL` },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.ENUM,
        including: [],
        null: nullFilter
      })).toBe(expected)

      expect(parseFilterItem('columnName', {
        filterType: FilterType.ENUM,
        null: nullFilter
      } as ColumnFilter)).toBe(expected)
    })
  })
})

describe('parseFilterItem | RANGE filter', () => {
  it('should throw error for invalid range', () => {
    expect(() => {
      parseFilterItem('columnName', { 
        filterType: FilterType.RANGE, 
        range: [18] as never, 
        null: 'N/A' 
      })
    }).toThrow('Invalid range: 18')

    expect(() => {
      parseFilterItem('columnName', { 
        filterType: FilterType.RANGE, 
        range: ['18'] as never, 
        null: 'N/A' 
      })
    }).toThrow('Invalid range: 18')
  })

  it('should return a filter expression for valid range', () => {
    const range = [18, 42]
    const baseExpr = `columnName BETWEEN 18 AND 42`
    
    const testCases = [
      { nullFilter: 'N/A' as const, expected: baseExpr },
      { nullFilter: 'Include' as const, expected: `${baseExpr} OR columnName IS NULL` },
      { nullFilter: 'Exclude' as const, expected: baseExpr },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.RANGE,
        range,
        null: nullFilter
      })).toBe(expected)
    })
  })

  it('should handle empty or missing range', () => {
    const testCases = [
      { nullFilter: 'N/A' as const, expected: null },
      { nullFilter: 'Include' as const, expected: null },
      { nullFilter: 'Exclude' as const, expected: `columnName IS NOT NULL` },
      { nullFilter: 'Only Null' as const, expected: `columnName IS NULL` }
    ]

    testCases.forEach(({ nullFilter, expected }) => {
      expect(parseFilterItem('columnName', {
        filterType: FilterType.RANGE,
        range: null as never,
        null: nullFilter
      })).toBe(expected)

      expect(parseFilterItem('columnName', {
        filterType: FilterType.RANGE,
        null: nullFilter
      } as ColumnFilter)).toBe(expected)
    })
  })
})

describe('parseFilterItem | column name sanitization', () => {
  it('should handle special characters in column names', () => {
    expect(parseFilterItem('column name', {
      filterType: FilterType.TEXT,
      contains: 'value',
      null: 'Exclude'
    })).toBe('CAST("column name" AS VARCHAR) LIKE \'%value%\'')

    expect(parseFilterItem('column-name', {
      filterType: FilterType.ENUM,
      including: ['value1'],
      null: 'Exclude'
    })).toBe('"column-name" IN (\'value1\')')

    expect(parseFilterItem('table.column', {
      filterType: FilterType.RANGE,
      range: [1, 10],
      null: 'Exclude'
    })).toBe('table.column BETWEEN 1 AND 10')
  })
})

describe('toSqlCondition', () => {
  // Mock console.error to avoid test output noise
  const originalConsoleError = console.error
  beforeEach(() => {
    console.error = jest.fn()
  })
  afterEach(() => {
    console.error = originalConsoleError
  })

  it('should return empty string for empty filters object', () => {
    expect(toSqlCondition({})).toBe('')
  })

  it('should handle single filter', () => {
    const filters = {
      name: {
        filterType: FilterType.TEXT,
        contains: 'john',
        null: 'Exclude' as const
      }
    }
    
    expect(toSqlCondition(filters)).toBe("(CAST(name AS VARCHAR) LIKE '%john%')")
  })

  it('should combine multiple filters with AND', () => {
    const filters = {
      name: {
        filterType: FilterType.TEXT,
        contains: 'john',
        null: 'Exclude' as const
      },
      age: {
        filterType: FilterType.RANGE,
        range: [18, 65],
        null: 'Exclude' as const
      },
      status: {
        filterType: FilterType.ENUM,
        including: ['active', 'pending'],
        null: 'Include' as const
      }
    }
    
    const result = toSqlCondition(filters)
    expect(result).toBe("(CAST(name AS VARCHAR) LIKE '%john%') AND (age BETWEEN 18 AND 65) AND (status IN ('active','pending') OR status IS NULL)")
  })

  it('should skip null filters', () => {
    const filters = {
      name: {
        filterType: FilterType.TEXT,
        contains: 'john',
        null: 'Exclude' as const
      },
      age: null,
      status: {
        filterType: FilterType.ENUM,
        including: ['active'],
        null: 'Exclude' as const
      }
    }
    
    expect(toSqlCondition(filters)).toBe("(CAST(name AS VARCHAR) LIKE '%john%') AND (status IN ('active'))")
  })

  it('should skip filters that return null from parseFilterItem', () => {
    const filters = {
      name: {
        filterType: FilterType.TEXT,
        contains: '', // Empty contains returns null
        null: 'N/A' as const
      },
      age: {
        filterType: FilterType.RANGE,
        range: [18, 65],
        null: 'Exclude' as const
      }
    }
    
    expect(toSqlCondition(filters)).toBe('(age BETWEEN 18 AND 65)')
  })

  it('should handle filters with only null values', () => {
    const filters = {
      name: null,
      age: null
    }
    
    expect(toSqlCondition(filters)).toBe('')
  })

  it('should handle filters that all return null conditions', () => {
    const filters = {
      name: {
        filterType: FilterType.TEXT,
        contains: '',
        null: 'N/A' as const
      },
      status: {
        filterType: FilterType.ENUM,
        including: [],
        null: 'N/A' as const
      }
    }
    
    expect(toSqlCondition(filters)).toBe('')
  })

  it('should handle errors gracefully and continue processing other filters', () => {
    const filters = {
      validFilter: {
        filterType: FilterType.TEXT,
        contains: 'test',
        null: 'Exclude' as const
      },
      invalidFilter: {
        filterType: FilterType.RANGE,
        range: [1], // Invalid range - should cause error
        null: 'Exclude' as const
      } as ColumnFilter,
      anotherValidFilter: {
        filterType: FilterType.ENUM,
        including: ['active'],
        null: 'Exclude' as const
      }
    }
    
    const result = toSqlCondition(filters)
    expect(result).toBe("(CAST(validFilter AS VARCHAR) LIKE '%test%') AND (anotherValidFilter IN ('active'))")
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error parsing filter for column invalidFilter:',
      expect.any(Error)
    )
  })

  it('should handle special characters in column names', () => {
    const filters = {
      'column name': {
        filterType: FilterType.TEXT,
        contains: 'test',
        null: 'Exclude' as const
      },
      'table.column': {
        filterType: FilterType.RANGE,
        range: [1, 10],
        null: 'Exclude' as const
      }
    }
    
    expect(toSqlCondition(filters)).toBe('(CAST("column name" AS VARCHAR) LIKE \'%test%\') AND (table.column BETWEEN 1 AND 10)')
  })

  it('should preserve order of filters in the result', () => {
    const filters = {
      zColumn: {
        filterType: FilterType.TEXT,
        contains: 'z',
        null: 'Exclude' as const
      },
      aColumn: {
        filterType: FilterType.TEXT,
        contains: 'a',
        null: 'Exclude' as const
      },
      mColumn: {
        filterType: FilterType.TEXT,
        contains: 'm',
        null: 'Exclude' as const
      }
    }
    
    const result = toSqlCondition(filters)
    expect(result).toBe("(CAST(zColumn AS VARCHAR) LIKE '%z%') AND (CAST(aColumn AS VARCHAR) LIKE '%a%') AND (CAST(mColumn AS VARCHAR) LIKE '%m%')")
  })
})