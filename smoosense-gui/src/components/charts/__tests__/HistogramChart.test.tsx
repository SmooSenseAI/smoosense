import { render, screen } from '@testing-library/react'
import MiniHistogram from '../MiniHistogram'
import type { HistogramCntValue } from '@/lib/features/colStats/types'

describe('MiniHistogram', () => {
  const mockHistogramData: HistogramCntValue[] = [
    { value: '[0, 1)', cnt: 10, binIdx: 0, binMin: 0, binMax: 1 },
    { value: '[1, 2)', cnt: 20, binIdx: 1, binMin: 1, binMax: 2 },
    { value: '[2, 3)', cnt: 15, binIdx: 2, binMin: 2, binMax: 3 },
    { value: '[3, 4)', cnt: 5, binIdx: 3, binMin: 3, binMax: 4 },
    { value: '[4, 5)', cnt: 3, binIdx: 4, binMin: 4, binMax: 5 }
  ]

  it('should render histogram chart', () => {
    const { container } = render(
      <MiniHistogram data={mockHistogramData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should show no data message when data is empty', () => {
    const emptyData: HistogramCntValue[] = []
    render(<MiniHistogram data={emptyData} />)
    
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should handle undefined data gracefully', () => {
    render(<MiniHistogram data={undefined as unknown as HistogramCntValue[]} />)
    
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should handle numeric values', () => {
    const numericData: HistogramCntValue[] = [
      { value: '[0, 1)', cnt: 10, binIdx: 0, binMin: 0, binMax: 1 },
      { value: '[1, 2)', cnt: 20, binIdx: 1, binMin: 1, binMax: 2 },
      { value: '[2, 3)', cnt: 15, binIdx: 2, binMin: 2, binMax: 3 }
    ]
    const { container } = render(
      <MiniHistogram data={numericData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should always use full width and height', () => {
    const { container } = render(
      <MiniHistogram data={mockHistogramData} />
    )
    
    const chartContainer = container.firstChild as HTMLElement
    expect(chartContainer).toHaveClass('w-full', 'h-full')
  })
})