import { render, screen, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import Table from '../page'
import { createTestStore } from '@/lib/test-utils'


const renderWithProvider = (component: ReactElement, stateOverrides = {}) => {
  const store = createTestStore(stateOverrides)
  return act(() => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    )
  })
}

// Mock Next.js router
const mockUseSearchParams = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/Table',
  useSearchParams: () => mockUseSearchParams(),
}))


describe('Table Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error when tablePath is provided', () => {
    // Mock URLSearchParams to return a tablePath
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tablePath=/test/file.csv'))

    expect(() => renderWithProvider(<Table />, { 
      ui: { tablePath: '/test/file.csv' },
      rowData: { data: [], loading: false, error: null }
    })).not.toThrow()
  })

  it('should render without error when tablePath is not provided', () => {
    // Mock URLSearchParams to return no tablePath
    mockUseSearchParams.mockReturnValue(new URLSearchParams())

    expect(() => renderWithProvider(<Table />)).not.toThrow()
    
    // Just check that some error content is rendered
    expect(screen.getByText(/Error: Missing File Path/i)).toBeInTheDocument()
  })
})