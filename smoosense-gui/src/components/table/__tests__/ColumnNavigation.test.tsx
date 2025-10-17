import { render, act } from '@testing-library/react'
import ColumnNavigation from '../ColumnNavigation'

// Mock the useColumnMeta hook to prevent async operations in tests
jest.mock('@/lib/hooks/useColumnMeta', () => ({
  useColumnMeta: jest.fn(() => ({
    columns: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

// Mock the Redux hooks with proper state structure
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector) => {
    const mockState = {
      ui: { filePath: '/test/file.csv', debugMode: false },
      ag: { columnDefs: [], columnDefsInitialized: false },
      derivedColumns: { columns: [], initialized: false }
    }
    return selector(mockState)
  }),
  useDispatch: () => jest.fn(),
}))

const renderWithoutProvider = () => {
  return act(() => {
    return render(<ColumnNavigation />)
  })
}

describe('ColumnNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error', () => {
    expect(() => renderWithoutProvider()).not.toThrow()
  })
})