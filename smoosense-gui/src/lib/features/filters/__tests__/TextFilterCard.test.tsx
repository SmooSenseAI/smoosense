import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import TextFilterCard from '../TextFilterCard'
import { FilterType } from '@/lib/features/filters/types'
import { createTestStore } from '@/lib/test-utils'

// Mock hooks
jest.mock('@/lib/hooks', () => ({
  useColFilteredStats: jest.fn(() => ({
    data: { cnt_null: 5, cnt_not_null: 95 },
    error: null,
    hasData: true,
    loading: false,
    hasActiveFilters: false
  })),
  useSingleColumnMeta: jest.fn(() => ({
    columnMeta: {
      stats: {
        hasNull: true,
        allNull: false
      }
    }
  })),
  useAppSelector: jest.requireActual('react-redux').useSelector,
  useAppDispatch: jest.requireActual('react-redux').useDispatch
}))

// Mock useIsCategorical hook
jest.mock('@/lib/hooks/useIsCategorical', () => ({
  useIsCategorical: jest.fn(() => ({
    isCategorical: false,
    loading: false,
    error: null
  }))
}))

const renderWithProvider = (component: React.ReactElement, stateOverrides?: Parameters<typeof createTestStore>[0]) => {
  const store = createTestStore(stateOverrides)
  return { store, ...render(
    <Provider store={store}>
      {component}
    </Provider>
  ) }
}

describe('TextFilterCard', () => {
  const columnName = 'test_column'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render with default values', () => {
    renderWithProvider(<TextFilterCard columnName={columnName} />)
    
    expect(screen.getByPlaceholderText('Enter search term...')).toBeInTheDocument()
    expect(screen.getByText('Search Text')).toBeInTheDocument()
    expect(screen.getByText('Apply')).toBeInTheDocument()
  })

  it('should initialize with existing filter values', () => {
    renderWithProvider(<TextFilterCard columnName={columnName} />, {
      ag: {
        filters: {
          [columnName]: {
            contains: 'existing search',
            null: 'Exclude',
            filterType: FilterType.TEXT
          }
        }
      }
    })
    
    expect(screen.getByDisplayValue('existing search')).toBeInTheDocument()
  })

  it('should update search term on input change', () => {
    renderWithProvider(<TextFilterCard columnName={columnName} />)
    
    const input = screen.getByPlaceholderText('Enter search term...')
    fireEvent.change(input, { target: { value: 'hello' } })
    
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
  })

  it('should debounce search term updates', async () => {
    renderWithProvider(<TextFilterCard columnName={columnName} />)
    
    const input = screen.getByPlaceholderText('Enter search term...')
    
    // Rapid changes
    fireEvent.change(input, { target: { value: 'a' } })
    jest.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'ab' } })
    jest.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'abc' } })
    
    // Complete the debounce
    jest.advanceTimersByTime(300)
    
    // The debounced value should be updated
    expect(screen.getByDisplayValue('abc')).toBeInTheDocument()
  })

  it('should reset filter when cancel is clicked', () => {
    renderWithProvider(<TextFilterCard columnName={columnName} />, {
      ag: {
        filters: {
          [columnName]: {
            contains: 'original search',
            null: 'Include',
            filterType: FilterType.TEXT
          }
        }
      }
    })
    
    // Change the search term
    const input = screen.getByPlaceholderText('Enter search term...')
    fireEvent.change(input, { target: { value: 'changed search' } })
    
    // Click cancel
    const cancelButton = screen.getByText('Cancel Changes')
    fireEvent.click(cancelButton)
    
    // Should reset to original value
    expect(screen.getByDisplayValue('original search')).toBeInTheDocument()
  })

  it('should apply filter when Apply button is clicked', async () => {
    const { store } = renderWithProvider(<TextFilterCard columnName={columnName} />)
    
    // Enter search term
    const input = screen.getByPlaceholderText('Enter search term...')
    fireEvent.change(input, { target: { value: 'test search' } })
    
    // Wait for debounce
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      // Click apply
      const applyButton = screen.getByText('Apply')
      fireEvent.click(applyButton)
      
      // Check if filter was applied to store
      const state = store.getState()
      expect(state.ag.filters[columnName]).toEqual({
        contains: 'test search',
        null: 'Include',
        filterType: FilterType.TEXT
      })
    })
  })

  it('should remove filter when empty search term is applied', async () => {
    const { store } = renderWithProvider(<TextFilterCard columnName={columnName} />, {
      ag: {
        filters: {
          [columnName]: {
            contains: 'existing search',
            null: 'Include',
            filterType: FilterType.TEXT
          }
        }
      }
    })
    
    // Clear search term
    const input = screen.getByPlaceholderText('Enter search term...')
    fireEvent.change(input, { target: { value: '' } })
    
    // Wait for debounce
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      // Click apply
      const applyButton = screen.getByText('Apply')
      fireEvent.click(applyButton)
      
      // Check if filter was removed from store
      const state = store.getState()
      expect(state.ag.filters[columnName]).toBeUndefined()
    })
  })

  it('should show debug section when debug mode is enabled', () => {
    const { container } = renderWithProvider(<TextFilterCard columnName={columnName} />, {
      ui: { debugMode: true }
    })
    
    // Debug section should be visible - look for the debug container with border-t class
    expect(container.querySelector('.border-t')).toBeInTheDocument()
  })

  it('should hide debug section when debug mode is disabled', () => {
    const { container } = renderWithProvider(<TextFilterCard columnName={columnName} />, {
      ui: { debugMode: false }
    })
    
    // Debug section should not be visible - no border-t div (only from debug section)
    const borderTElements = container.querySelectorAll('.border-t')
    expect(borderTElements.length).toBe(0) // No debug section rendered
  })
})