import { getColumnMetadata } from '../queries'
import { API_PREFIX } from '@/lib/utils/urlUtils'

// Mock fetch for testing
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock dispatch for testing
const mockDispatch = jest.fn()

describe('getColumnMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDispatch.mockClear()
  })

  it('should transform column metadata with type shortcuts', async () => {
    // Mock API response with sample column metadata
    const mockApiResponse = {
      column_names: ['column_name', 'column_type'],
      rows: [
        ['id', 'INTEGER'],
        ['name', 'VARCHAR'],
        ['price', 'DECIMAL(10,2)'],
        ['is_active', 'BOOLEAN'],
        ['created_at', 'TIMESTAMP']
      ],
      runtime: 0.1,
      status: 'success'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    const result = await getColumnMetadata('/test/file.csv', mockDispatch)

    expect(result).toHaveLength(5)
    
    // Test integer column
    expect(result[0]).toEqual({
      column_name: 'id',
      duckdbType: 'INTEGER',
      typeShortcuts: {
        isInteger: true,
        isFloat: false,
        isNumeric: true,
        isBoolean: false,
        isString: false,
        isPrimitive: true,
        agType: 'number',
        isDatetime: false,
        isNumericArray: false,
      },
      stats: null
    })

    // Test string column
    expect(result[1]).toEqual({
      column_name: 'name',
      duckdbType: 'VARCHAR',
      typeShortcuts: {
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: false,
        isString: true,
        isPrimitive: true,
        agType: 'text',
        isDatetime: false,
        isNumericArray: false,
      },
      stats: null
    })

    // Test decimal column (complex type)
    expect(result[2]).toEqual({
      column_name: 'price',
      duckdbType: 'DECIMAL(10,2)',
      typeShortcuts: {
        isInteger: false,
        isFloat: true,
        isNumeric: true,
        isBoolean: false,
        isString: false,
        isPrimitive: true,
        agType: 'number',
        isDatetime: false,
        isNumericArray: false,
      },
      stats: null
    })

    // Test boolean column
    expect(result[3]).toEqual({
      column_name: 'is_active',
      duckdbType: 'BOOLEAN',
      typeShortcuts: {
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: true,
        isString: false,
        isPrimitive: true,
        agType: 'boolean',
        isDatetime: false,
        isNumericArray: false,
      },
      stats: null
    })

    // Test datetime column
    expect(result[4]).toEqual({
      column_name: 'created_at',
      duckdbType: 'TIMESTAMP',
      typeShortcuts: {
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: false,
        isString: false,
        isPrimitive: true,
        agType: 'dateString',
        isDatetime: true,
        isNumericArray: false,
      },
      stats: null
    })
  })

  it('should handle empty file path', async () => {
    await expect(getColumnMetadata('', mockDispatch)).rejects.toThrow('File path cannot be empty')
    await expect(getColumnMetadata('   ', mockDispatch)).rejects.toThrow('File path cannot be empty')
  })

  it('should handle API errors', async () => {
    const mockErrorResponse = {
      column_names: [],
      rows: [],
      runtime: 0,
      status: 'error',
      error: 'Table not found'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    } as Response)

    await expect(getColumnMetadata('/nonexistent/file.csv', mockDispatch)).rejects.toThrow('Table not found')
  })

  it('should call the correct SQL query', async () => {
    const mockApiResponse = {
      column_names: ['column_name', 'column_type'],
      rows: [],
      runtime: 0.1,
      status: 'success'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    await getColumnMetadata('/test/file.csv', mockDispatch)

    expect(mockFetch).toHaveBeenCalledWith(`${API_PREFIX}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "SELECT column_name, column_type FROM (DESCRIBE SELECT * FROM '/test/file.csv')"
      }),
    })
  })

  it('should flatten struct fields into separate columns', async () => {
    // Mock API response with struct column type
    const mockApiResponse = {
      column_names: ['column_name', 'column_type'],
      rows: [
        ['id', 'INTEGER'],
        ['timestamp_parts', 'STRUCT("day" BIGINT, day_name VARCHAR, "hour" BIGINT)'],
        ['name', 'VARCHAR']
      ],
      runtime: 0.1,
      status: 'success'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    const result = await getColumnMetadata('/test/file.csv', mockDispatch)

    // Should have original columns plus flattened struct fields
    expect(result).toHaveLength(6) // 3 original + 3 flattened struct fields

    // Check original columns
    expect(result[0].column_name).toBe('id')
    expect(result[1].column_name).toBe('timestamp_parts')
    expect(result[5].column_name).toBe('name')

    // Check flattened struct fields
    expect(result[2]).toEqual({
      column_name: 'timestamp_parts.day',
      duckdbType: 'BIGINT',
      typeShortcuts: expect.objectContaining({
        isInteger: true,
        isNumeric: true
      }),
      stats: null
    })

    expect(result[3]).toEqual({
      column_name: 'timestamp_parts.day_name',
      duckdbType: 'VARCHAR',
      typeShortcuts: expect.objectContaining({
        isString: true
      }),
      stats: null
    })

    expect(result[4]).toEqual({
      column_name: 'timestamp_parts.hour',
      duckdbType: 'BIGINT',
      typeShortcuts: expect.objectContaining({
        isInteger: true,
        isNumeric: true
      }),
      stats: null
    })
  })

  it('should handle struct with nested structs', async () => {
    const mockApiResponse = {
      column_names: ['column_name', 'column_type'],
      rows: [
        ['user_data', 'STRUCT(id INTEGER, profile STRUCT(name VARCHAR, age INTEGER))']
      ],
      runtime: 0.1,
      status: 'success'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    const result = await getColumnMetadata('/test/file.csv', mockDispatch)

    expect(result).toHaveLength(4) // 1 original + 3 flattened fields
    
    expect(result.map(r => r.column_name)).toEqual([
      'user_data',
      'user_data.id',
      'user_data.profile.name',
      'user_data.profile.age'
    ])
  })

  describe('Parquet stats functionality', () => {
    it('should fetch and include Parquet stats for .parquet files', async () => {
      // Mock metadata query response
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [
          ['id', 'INTEGER'],
          ['price', 'DECIMAL(10,2)']
        ],
        runtime: 0.1,
        status: 'success'
      }

      // Mock Parquet stats query response
      const mockStatsResponse = {
        column_names: ['column_name', 'cntAll', 'min', 'max', 'cntNull'],
        rows: [
          ['id', 1000, 1, 1000, 0],
          ['price', 1000, 10.50, 999.99, 50]
        ],
        runtime: 0.2,
        status: 'success'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsResponse,
        } as Response)

      const result = await getColumnMetadata('/test/file.parquet', mockDispatch)

      expect(result).toHaveLength(2)
      
      // Check that stats are included for Parquet files
      expect(result[0]).toEqual({
        column_name: 'id',
        duckdbType: 'INTEGER',
        typeShortcuts: expect.any(Object),
        stats: {
          min: 1,
          max: 1000,
          cntAll: 1000,
          cntNull: 0,
          hasNull: false,
          singleValue: false,
          allNull: false
        }
      })

      expect(result[1]).toEqual({
        column_name: 'price',
        duckdbType: 'DECIMAL(10,2)',
        typeShortcuts: expect.any(Object),
        stats: {
          min: 10.50,
          max: 999.99,
          cntAll: 1000,
          cntNull: 50,
          hasNull: true,
          singleValue: false,
          allNull: false
        }
      })

      // Verify that both metadata and stats queries were called
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      // Verify the Parquet stats query was called
      expect(mockFetch).toHaveBeenNthCalledWith(2, `${API_PREFIX}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining("parquet_metadata('/test/file.parquet')"),
      })
    })

    it('should not fetch Parquet stats for non-Parquet files', async () => {
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [
          ['id', 'INTEGER']
        ],
        runtime: 0.1,
        status: 'success'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadataResponse,
      } as Response)

      const result = await getColumnMetadata('/test/file.csv', mockDispatch)

      expect(result).toHaveLength(1)
      expect(result[0].stats).toBeNull()
      
      // Should only call the metadata query, not stats query
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle singleValue correctly when min equals max', async () => {
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [['status', 'VARCHAR']],
        runtime: 0.1,
        status: 'success'
      }

      const mockStatsResponse = {
        column_names: ['column_name', 'cntAll', 'min', 'max', 'cntNull'],
        rows: [['status', 1000, 'active', 'active', 0]],
        runtime: 0.2,
        status: 'success'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsResponse,
        } as Response)

      const result = await getColumnMetadata('/test/file.parquet', mockDispatch)

      expect(result[0].stats).toEqual({
        min: 'active',
        max: 'active',
        cntAll: 1000,
        cntNull: 0,
        hasNull: false,
        singleValue: true,
        allNull: false
      })
    })

    it('should handle null min/max values correctly', async () => {
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [['nullable_col', 'VARCHAR']],
        runtime: 0.1,
        status: 'success'
      }

      const mockStatsResponse = {
        column_names: ['column_name', 'cntAll', 'min', 'max', 'cntNull'],
        rows: [['nullable_col', 1000, null, null, 1000]],
        runtime: 0.2,
        status: 'success'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsResponse,
        } as Response)

      const result = await getColumnMetadata('/test/file.parquet', mockDispatch)

      expect(result[0].stats).toEqual({
        min: null,
        max: null,
        cntAll: 1000,
        cntNull: 1000,
        hasNull: true,
        singleValue: false,
        allNull: true
      })
    })

    it('should calculate allNull correctly for various scenarios', async () => {
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [
          ['col_all_null', 'VARCHAR'],
          ['col_some_null', 'INTEGER'],
          ['col_no_null', 'VARCHAR']
        ],
        runtime: 0.1,
        status: 'success'
      }

      const mockStatsResponse = {
        column_names: ['column_name', 'cntAll', 'min', 'max', 'cntNull'],
        rows: [
          ['col_all_null', 100, null, null, 100],    // allNull should be true
          ['col_some_null', 100, 1, 50, 25],          // allNull should be false  
          ['col_no_null', 100, 'a', 'z', 0]           // allNull should be false
        ],
        runtime: 0.1,
        status: 'success'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsResponse,
        } as Response)

      const result = await getColumnMetadata('/test/file.parquet', mockDispatch)

      expect(result[0].stats?.allNull).toBe(true)   // col_all_null: 100 nulls out of 100
      expect(result[1].stats?.allNull).toBe(false)  // col_some_null: 25 nulls out of 100
      expect(result[2].stats?.allNull).toBe(false)  // col_no_null: 0 nulls out of 100
    })

    it('should handle Parquet stats query errors gracefully', async () => {
      const mockMetadataResponse = {
        column_names: ['column_name', 'column_type'],
        rows: [['id', 'INTEGER']],
        runtime: 0.1,
        status: 'success'
      }

      const mockStatsErrorResponse = {
        column_names: [],
        rows: [],
        runtime: 0,
        status: 'error',
        error: 'Failed to read Parquet metadata'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsErrorResponse,
        } as Response)

      const result = await getColumnMetadata('/test/file.parquet', mockDispatch)

      expect(result).toHaveLength(1)
      expect(result[0].stats).toBeNull()
    })
  })
})