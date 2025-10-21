import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useCardinality, useCardinalityBulk } from '../useCardinality'
import { createTestStore } from '@/lib/test-utils'

// Mock the single column metadata hook
jest.mock('../useColumnMeta', () => ({
  useSingleColumnMeta: jest.fn(() => ({
    columnMeta: {
      column_name: 'test_col',
      duckdbType: 'VARCHAR',
      typeShortcuts: { 
        isInteger: false, 
        isFloat: false, 
        isNumeric: false, 
        isBoolean: false, 
        isString: true, 
        isPrimitive: true, 
        agType: 'text', 
        isDatetime: false 
      },
      stats: null
    },
    loading: false,
    error: null,
    tablePath: '/test/file.csv'
  }))
}))

// Get reference to the mock function after importing
import { useSingleColumnMeta } from '../useColumnMeta'
const mockUseSingleColumnMeta = useSingleColumnMeta as jest.MockedFunction<typeof useSingleColumnMeta>

describe('useCardinality', () => {
  it('should return column-specific cardinality data', () => {
    const store = createTestStore({
      ui: { tablePath: '/test/file.csv' },
      columns: {
        cardinality: {
          'error_col': {
            data: {
              approxCntD: null,
              cntD: null,
              distinctRatio: null,
              cardinality: 'unknown',
              source: 'query error'
            },
            loading: false,
            error: 'Query failed'
          }
        },
        baseStats: {}
      }
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useCardinality('error_col'), { wrapper })
    expect(result.current.data?.source).toBe('query error')
    expect(result.current.data?.cardinality).toBe('unknown')
    expect(result.current.error).toBe('Query failed')
  })

  it('should return column-specific cardinality data for success case', () => {
    const store = createTestStore({
      ui: { tablePath: '/test/file.csv' },
      columns: {
        cardinality: {
          'success_col': {
            data: {
              approxCntD: 100,
              cntD: 100,
              distinctRatio: 0.1,
              cardinality: 'low',
              source: 'from query'
            },
            loading: false,
            error: null
          }
        },
        baseStats: {}
      }
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useCardinality('success_col'), { wrapper })
    expect(result.current.data?.source).toBe('from query')
    expect(result.current.data?.cardinality).toBe('low')
    expect(result.current.data?.approxCntD).toBe(100)
    expect(result.current.data?.cntD).toBe(100)
    expect(result.current.data?.distinctRatio).toBe(0.1)
    expect(result.current.error).toBeNull()
  })

  it('should work with no file path (no auto-fetching)', () => {
    // Configure mock to return empty tablePath for this test
    mockUseSingleColumnMeta.mockReturnValueOnce({
      columnMeta: {
        column_name: 'test_col',
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
          isNumericArray: false
        },
        stats: null
      },
      loading: false,
      error: null,
      tablePath: ''
    })

    const store = createTestStore({
      ui: { tablePath: null } // No file path to prevent auto-fetching
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useCardinality('any_col'), { wrapper })

    expect(result.current.data).toBeNull()
    // loading should be false when no tablePath is available
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should test bulk cardinality access', () => {
    const store = createTestStore({
      ui: { tablePath: '/test/file.csv' },
      columns: {
        cardinality: {
          'test_col': {
            data: {
              approxCntD: 50,
              cntD: 50,
              distinctRatio: 0.5,
              cardinality: 'low',
              source: 'from metadata'
            },
            loading: false,
            error: null
          }
        },
        baseStats: {}
      }
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useCardinalityBulk(), { wrapper })

    expect(result.current.cardinalityColumns).toBeDefined()
    expect(result.current.cardinalityColumns['test_col']?.data?.cardinality).toBe('low')
  })
})