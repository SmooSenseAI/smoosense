import { render, screen, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import TableNavbar from '../TableNavbar'
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

// Mock the hooks used by TableStatusBar
jest.mock('@/lib/hooks/useTotalRows', () => ({
  useTotalRows: jest.fn(() => 100)
}))

jest.mock('@/lib/hooks/useColumnMeta', () => ({
  useColumnMeta: jest.fn(() => ({
    columns: [{ column_name: 'col1', data_type: 'string', null_count: 0, non_null_count: 100 }],
    loading: false,
    error: null,
    tablePath: '/test/file.csv'
  }))
}))

// Override global navigation mock for this test
jest.mock('next/navigation', () => ({
  usePathname: () => '/Table',
  useSearchParams: () => new URLSearchParams(),
}))

describe('TableNavbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the SmooSense logo', () => {
    renderWithProvider(<TableNavbar />)
    const logo = screen.getByAltText('SmooSense')
    expect(logo).toBeInTheDocument()
  })

  it('renders main navigation tabs', () => {
    renderWithProvider(<TableNavbar />)
    
    expect(screen.getByText('Summarize')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('Plot')).toBeInTheDocument()
    expect(screen.getByText('Query')).toBeInTheDocument()
  })

  it('renders Table and Gallery as main tabs', () => {
    renderWithProvider(<TableNavbar />)
    
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
  })

  it('does not render plot sub-tabs in navbar when Plot is active', () => {
    renderWithProvider(<TableNavbar />, { ui: { activeTab: 'Plot' } })
    
    expect(screen.queryByText('BubblePlot')).not.toBeInTheDocument()
    expect(screen.queryByText('HeatMap')).not.toBeInTheDocument()
    expect(screen.queryByText('Histogram')).not.toBeInTheDocument()
    expect(screen.queryByText('BoxPlot')).not.toBeInTheDocument()
  })

  it('does not render plot sub-tabs when Summarize is active', () => {
    renderWithProvider(<TableNavbar />, { ui: { activeTab: 'Summarize' } })
    
    expect(screen.queryByText('BubblePlot')).not.toBeInTheDocument()
  })

  it('does not render plot sub-tabs when Query is active', () => {
    renderWithProvider(<TableNavbar />, { ui: { activeTab: 'Query' } })
    
    expect(screen.queryByText('BubblePlot')).not.toBeInTheDocument()
  })

  it('renders action buttons', () => {
    renderWithProvider(<TableNavbar />)
    
    // Check for buttons by their role since they now contain icons instead of text
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('shows Table as active by default', () => {
    renderWithProvider(<TableNavbar />)
    
    const tableTab = screen.getByRole('tab', { name: 'Table' })
    expect(tableTab).toHaveAttribute('data-state', 'active')
  })

  it('renders status information when tablePath is provided', () => {
    renderWithProvider(<TableNavbar />, { 
      ui: { tablePath: '/test/file.csv' },
      viewing: { totalRows: 100 },
      columnMeta: { 
        data: [{ column_name: 'col1', data_type: 'string', null_count: 0, non_null_count: 100 }], 
        loading: false, 
        error: null 
      },
      ag: { sorting: [] }
    })
    
    expect(screen.getByText(/100 rows/)).toBeInTheDocument()
    expect(screen.getByText(/No sorting/)).toBeInTheDocument()
    expect(screen.getByText(/No filters applied/)).toBeInTheDocument()
  })

  it('renders without error when debug mode is enabled', () => {
    expect(() => renderWithProvider(<TableNavbar />, { ui: { debugMode: true } })).not.toThrow()
    
    // Just ensure the navbar renders successfully with debug mode enabled
    expect(screen.getByText('Summarize')).toBeInTheDocument()
  })
})