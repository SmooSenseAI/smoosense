import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useColFilteredStats } from '../useColFilteredStats'
import { createTestStore } from '@/lib/test-utils'
import { FilterType } from '@/lib/features/filters/types'

// Mock the base stats hook with shared dependencies
jest.mock('../useColBaseStats', () => ({
  useColBaseStats: jest.fn(() => ({
    data: null,
    loading: false,
    error: null,
    hasData: false,
    columnMeta: null,
    isCategorical: false,
    filePath: '/test/path',
    metaLoading: false,
    dispatch: jest.fn(),
    queryStats: jest.fn(),
    getCategoricalStats: jest.fn(() => null),
    getHistogramStats: jest.fn(() => null),
    getTextStats: jest.fn(() => null),
  }))
}))

const renderHookWithProvider = (columnName: string, stateOverrides?: Parameters<typeof createTestStore>[0]) => {
  const store = createTestStore({
    ui: {
      filePath: '/test/path'
    },
    ...stateOverrides
  })
  return renderHook(() => useColFilteredStats(columnName), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
  })
}

describe('useColFilteredStats', () => {
  const columnName = 'test_column'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without errors', () => {
    const { result } = renderHookWithProvider(columnName)
    
    expect(result.current).toBeDefined()
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasData).toBe(false)
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('should detect active filters', () => {
    const { result } = renderHookWithProvider(columnName, {
      ui: {
        filePath: '/test/path'
      },
      ag: {
        filters: {
          'some_column': { 
            filterType: FilterType.TEXT, 
            null: 'Include',
            contains: 'test' 
          }
        }
      }
    })
    
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('should provide type-safe getters', () => {
    const { result } = renderHookWithProvider(columnName)
    
    expect(typeof result.current.getCategoricalStats).toBe('function')
    expect(typeof result.current.getHistogramStats).toBe('function') 
    expect(typeof result.current.getTextStats).toBe('function')
  })

  it('should not provide queryStats function (removed)', () => {
    const { result } = renderHookWithProvider(columnName)
    
    expect('queryStats' in result.current).toBe(false)
  })

  it('should provide shared dependencies from baseStats', () => {
    const { result } = renderHookWithProvider(columnName)
    
    expect(result.current.columnMeta).toBe(null)
    expect(result.current.isCategorical).toBe(false)
    expect(result.current.filePath).toBe('/test/path')
  })
})