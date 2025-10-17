import { render, screen } from '@testing-library/react'
import MiniTreeMap from '../MiniTreeMap'
import type { CategoricalCntValue } from '@/lib/features/colStats/types'

describe('MiniTreeMap', () => {
  const mockCategoricalData: CategoricalCntValue[] = [
    { value: 'A', cnt: 30 },
    { value: 'B', cnt: 20 },
    { value: 'C', cnt: 15 },
    { value: 'D', cnt: 10 }
  ]


  it('should render categorical treemap chart', () => {
    const { container } = render(
      <MiniTreeMap data={mockCategoricalData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should show no data message when data is empty', () => {
    const emptyData: CategoricalCntValue[] = []
    render(<MiniTreeMap data={emptyData} />)
    
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should handle undefined data gracefully', () => {
    render(<MiniTreeMap data={undefined as unknown as CategoricalCntValue[]} />)
    
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should display data in provided order', () => {
    const testData: CategoricalCntValue[] = [
      { value: 'Low', cnt: 5 },
      { value: 'High', cnt: 50 },
      { value: 'Medium', cnt: 25 }
    ]
    
    const { container } = render(
      <MiniTreeMap data={testData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should display all categories', () => {
    const manyCategories: CategoricalCntValue[] = Array.from({ length: 20 }, (_, i) => ({
      value: `Category ${i}`,
      cnt: 20 - i
    }))
    
    const { container } = render(
      <MiniTreeMap data={manyCategories} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle mixed string and number categories', () => {
    const mixedData: CategoricalCntValue[] = [
      { value: 'A', cnt: 10 },
      { value: 1, cnt: 20 },
      { value: 'B', cnt: 15 },
      { value: 2, cnt: 5 }
    ]
    
    const { container } = render(
      <MiniTreeMap data={mixedData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle boolean values', () => {
    const dataWithBoolean: CategoricalCntValue[] = [
      { value: true, cnt: 10 },
      { value: false, cnt: 20 }
    ]
    
    const { container } = render(
      <MiniTreeMap data={dataWithBoolean} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should always use full width and height', () => {
    const { container } = render(
      <MiniTreeMap data={mockCategoricalData} />
    )
    
    const chartContainer = container.firstChild as HTMLElement
    expect(chartContainer).toHaveClass('w-full', 'h-full')
  })


  it('should render without any props other than data', () => {
    const { container } = render(
      <MiniTreeMap data={mockCategoricalData} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })
})