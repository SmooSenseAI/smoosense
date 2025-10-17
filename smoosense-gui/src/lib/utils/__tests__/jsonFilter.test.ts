import { filterJsonData, hasJsonMatches, countJsonMatches } from '../jsonFilter'

describe('filterJsonData', () => {
  const complexTestData = {
    user: {
      name: 'John Doe',
      address: null,
      email: 'john@example.com',
      profile: {
        age: 30,
        preferences: {
          theme: 'dark',
          debugMode: true
        }
      }
    },
    items: ['apple', 'banana', 'cherry'],
    metadata: {
      created: '2024-01-01',
      tags: ['fruit', 'food', 'organic'],
      settings: {
        verbose: false,
        debugLevel: 2
      }
    }
  }

  describe('basic functionality', () => {
    it('should return original data when search term is empty', () => {
      const result = filterJsonData(complexTestData, '')
      expect(result).toEqual(complexTestData)
    })

    it('should return original data when search term is whitespace only', () => {
      const result = filterJsonData(complexTestData, '   ')
      expect(result).toEqual(complexTestData)
    })

    it('should return empty object when no matches found', () => {
      const result = filterJsonData(complexTestData, 'nonexistent')
      expect(result).toEqual({})
    })

    it('should handle null and undefined inputs', () => {
      expect(filterJsonData(null, 'test')).toEqual({})
      expect(filterJsonData(undefined, 'test')).toEqual({})
    })

    it('should handle primitive inputs', () => {
      expect(filterJsonData('hello world', 'hello')).toEqual({})
      expect(filterJsonData(42, '42')).toEqual({})
      expect(filterJsonData(true, 'true')).toEqual({})
    })
  })

  describe('key matching', () => {
    it('should match object keys', () => {
      const result = filterJsonData(complexTestData, 'name')
      expect(result).toEqual({
        user: {
          name: 'John Doe'
        }
      })
    })

    it('should match nested object keys', () => {
      const result = filterJsonData(complexTestData, 'theme')
      expect(result).toEqual({
        user: {
          profile: {
            preferences: {
              theme: 'dark'
            }
          }
        }
      })
    })

    it('should match multiple keys with same term', () => {
      const result = filterJsonData(complexTestData, 'debug')
      expect(result).toEqual({
        user: {
          profile: {
            preferences: {
              debugMode: true
            }
          }
        },
        metadata: {
          settings: {
            debugLevel: 2
          }
        }
      })
    })
  })

  describe('value matching', () => {
    it('should match string values', () => {
      const result = filterJsonData(complexTestData, 'john')
      expect(result).toEqual({
        user: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
    })

    it('should match number values', () => {
      const result = filterJsonData(complexTestData, '30')
      expect(result).toEqual({
        user: {
          profile: {
            age: 30
          }
        }
      })
    })

    it('should match boolean values', () => {
      const result = filterJsonData(complexTestData, 'true')
      expect(result).toEqual({
        user: {
          profile: {
            preferences: {
              debugMode: true
            }
          }
        }
      })
    })

    it('should match array elements', () => {
      const result = filterJsonData(complexTestData, 'apple')
      expect(result).toEqual({
        items: ['apple']
      })
    })

    it('should match multiple array elements', () => {
      const result = filterJsonData(complexTestData, 'a')
      expect(result).toEqual({
        items: ['apple', 'banana'],
        metadata: {
          created: '2024-01-01',
          tags: ['fruit', 'food', 'organic'],
          settings: {
            verbose: false,
            debugLevel: 2
          }
        },
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          profile: {
            age: 30,
            preferences: {
              theme: 'dark'
            }
          }
        }
      })
    })
  })

  describe('path matching', () => {
    it('should match object paths', () => {
      const result = filterJsonData(complexTestData, 'user.profile')
      expect(result).toEqual({
        user: {
          profile: {
            age: 30,
            preferences: {
              theme: 'dark',
              debugMode: true
            }
          }
        }
      })
    })

    it('should match array paths', () => {
      const result = filterJsonData(complexTestData, 'items[0]')
      expect(result).toEqual({
        items: ['apple']
      })
    })

    it('should disable path matching when option is false', () => {
      const result = filterJsonData(complexTestData, 'user.profile', { includePathMatching: false })
      expect(result).toEqual({})
    })
  })

  describe('case sensitivity', () => {
    it('should be case insensitive by default', () => {
      const result = filterJsonData(complexTestData, 'JOHN')
      expect(result).toEqual({
        user: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
    })

    it('should respect case sensitivity when enabled', () => {
      const result = filterJsonData(complexTestData, 'JOHN', { caseSensitive: true })
      expect(result).toEqual({})
    })

    it('should match exact case when case sensitive', () => {
      const result = filterJsonData(complexTestData, 'John', { caseSensitive: true })
      expect(result).toEqual({
        user: {
          name: 'John Doe'
        }
      })
    })
  })

  describe('complex scenarios', () => {
    it('should handle deeply nested structures', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                target: 'found'
              }
            }
          }
        }
      }
      
      const result = filterJsonData(deepData, 'target')
      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              level4: {
                target: 'found'
              }
            }
          }
        }
      })
    })

    it('should handle mixed data types', () => {
      const mixedData = {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 'test', { nested: 'value' }],
        object: { key: 'test' }
      }

      const result = filterJsonData(mixedData, 'test')
      expect(result).toEqual({
        string: 'test',
        array: ['test'],
        object: { key: 'test' }
      })
    })

    it('should preserve structure for matching branches', () => {
      const result = filterJsonData(complexTestData, 'preferences')
      expect(result).toEqual({
        user: {
          profile: {
            preferences: {
              theme: 'dark',
              debugMode: true
            }
          }
        }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects and arrays', () => {
      const data = { empty: {}, emptyArray: [] }
      const result = filterJsonData(data, 'empty')
      expect(result).toEqual({
        empty: {},
        emptyArray: []
      })
    })

    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { name: 'test' }
      circular.self = circular
      
      // Should not throw an error
      expect(() => filterJsonData(circular, 'test')).not.toThrow()
    })

    it('should handle special characters in search term', () => {
      const data = { 'key-with-dash': 'value', '@symbol': 'test' }
      const result = filterJsonData(data, '-')
      expect(result).toEqual({
        'key-with-dash': 'value'
      })
    })

    it('should not match null values', () => {
      const data = { nullValue: null, validValue: 'null' }
      const result = filterJsonData(data, 'null')
      expect(result).toEqual({
        validValue: 'null'
      })
    })
  })
})

describe('hasJsonMatches', () => {
  const testData = { name: 'John', age: 30 }

  it('should return true when matches exist', () => {
    expect(hasJsonMatches(testData, 'john')).toBe(true)
    expect(hasJsonMatches(testData, 'name')).toBe(true)
    expect(hasJsonMatches(testData, '30')).toBe(true)
  })

  it('should return false when no matches exist', () => {
    expect(hasJsonMatches(testData, 'nonexistent')).toBe(false)
  })

  it('should return true for empty search term', () => {
    expect(hasJsonMatches(testData, '')).toBe(true)
    expect(hasJsonMatches(testData, '   ')).toBe(true)
  })

  it('should respect options', () => {
    expect(hasJsonMatches(testData, 'JOHN', { caseSensitive: true })).toBe(false)
    expect(hasJsonMatches(testData, 'John', { caseSensitive: true })).toBe(true)
  })
})

describe('countJsonMatches', () => {
  const testData = {
    test: 'test value',
    nested: {
      test: 'another test'
    },
    array: ['test', 'other']
  }

  it('should count all matches correctly', () => {
    // Should find: key 'test', value 'test value', key 'test', value 'another test', array item 'test', plus paths
    expect(countJsonMatches(testData, 'test')).toBe(7)
  })

  it('should return 0 for no matches', () => {
    expect(countJsonMatches(testData, 'nonexistent')).toBe(0)
  })

  it('should return 0 for empty search term', () => {
    expect(countJsonMatches(testData, '')).toBe(0)
  })

  it('should respect case sensitivity', () => {
    expect(countJsonMatches(testData, 'TEST', { caseSensitive: true })).toBe(0)
    expect(countJsonMatches(testData, 'test', { caseSensitive: true })).toBe(7)
  })

  it('should count path matches when enabled', () => {
    const pathData = { user: { profile: { name: 'test' } } }
    const withPath = countJsonMatches(pathData, 'profile')
    const withoutPath = countJsonMatches(pathData, 'profile', { includePathMatching: false })
    
    expect(withPath).toBe(3)
    expect(withoutPath).toBe(1)
  })
})