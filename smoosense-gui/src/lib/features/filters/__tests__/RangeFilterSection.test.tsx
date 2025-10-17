import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import RangeFilterSection from '../range/RangeFilterSection'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResponsiveContainer and chart components to avoid dimension warnings in tests and enable testing
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '400px', height: '300px' }}>
        {children}
      </div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-bar-chart">
        {children}
      </div>
    ),
    Bar: () => <div data-testid="mock-bar" />,
    XAxis: () => <div data-testid="mock-x-axis" />,
    YAxis: () => <div data-testid="mock-y-axis" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
    Brush: ({ onChange }: { onChange?: (brushData: { startIndex: number; endIndex: number }) => void }) => (
      <div 
        data-testid="mock-brush" 
        onClick={() => onChange?.({ startIndex: 0, endIndex: 2 })}
      />
    ),
  }
})

const mockHistogramData = [
  { value: '0-10', cnt: 30, binIdx: 0, binMin: 0, binMax: 10 },
  { value: '10-20', cnt: 20, binIdx: 1, binMin: 10, binMax: 20 },
  { value: '20-30', cnt: 15, binIdx: 2, binMin: 20, binMax: 30 },
  { value: '30-40', cnt: 10, binIdx: 3, binMin: 30, binMax: 40 }
]

describe('RangeFilterSection', () => {
  const mockOnRangeUpdate = jest.fn()
  const mockOnNullFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with histogram data', () => {
    render(
      <RangeFilterSection
        data={mockHistogramData}
        cntAll={75}
        nullFilterOption="Include"
        onNullFilterChange={mockOnNullFilterChange}
        onRangeUpdate={mockOnRangeUpdate}
        range={undefined}
      />
    )
    
    // Should render range inputs
    expect(screen.getByText('Range Min')).toBeInTheDocument()
    expect(screen.getByText('Range Max')).toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    
    // Should call onRangeUpdate due to useEffect on mount
    expect(mockOnRangeUpdate).toHaveBeenCalled()
  })
  

  it('should call onNullFilterChange to set value to Exclude when brush changes', () => {
    render(
      <RangeFilterSection
        data={mockHistogramData}
        cntAll={75}
        nullFilterOption="Include"
        onNullFilterChange={mockOnNullFilterChange}
        onRangeUpdate={mockOnRangeUpdate}
        range={undefined}
      />
    )
    
    // Find and click the mock brush to trigger onChange
    const brush = screen.getByTestId('mock-brush')
    fireEvent.click(brush)
    
    // Should call onNullFilterChange with "Exclude" when nullFilterOption was "Include"
    expect(mockOnNullFilterChange).toHaveBeenCalledWith('Exclude')
  })
  
  it('should not call onNullFilterChange when nullFilterOption is already Exclude', () => {
    render(
      <RangeFilterSection
        data={mockHistogramData}
        cntAll={75}
        nullFilterOption="Exclude"
        onNullFilterChange={mockOnNullFilterChange}
        onRangeUpdate={mockOnRangeUpdate}
        range={undefined}
      />
    )
    
    // Find and click the mock brush to trigger onChange
    const brush = screen.getByTestId('mock-brush')
    fireEvent.click(brush)
    
    // Should not call onNullFilterChange when already "Exclude"
    expect(mockOnNullFilterChange).not.toHaveBeenCalled()
  })
})