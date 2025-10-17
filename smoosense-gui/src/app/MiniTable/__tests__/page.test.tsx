import { render, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import MiniTable from '../page'
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
  usePathname: () => '/MiniTable',
  useSearchParams: () => mockUseSearchParams(),
}))

// Mock MainTable component
jest.mock('@/components/table/MainTable', () => {
  return function MockMainTable() {
    return <div data-testid="main-table">MainTable Component</div>
  }
})

describe('MiniTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error when filePath is provided', () => {
    // Mock URLSearchParams to return a filePath
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => key === 'filePath' ? '/test/file.csv' : null
    })

    expect(() => renderWithProvider(<MiniTable />, {
      ui: { filePath: '/test/file.csv' }
    })).not.toThrow()
  })

  it('should render without error when filePath is not provided', () => {
    // Mock URLSearchParams to return no filePath
    mockUseSearchParams.mockReturnValue({
      get: () => null
    })

    expect(() => renderWithProvider(<MiniTable />)).not.toThrow()
  })
})