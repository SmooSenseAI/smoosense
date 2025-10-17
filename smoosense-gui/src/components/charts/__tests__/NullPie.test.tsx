import { render } from '@testing-library/react'
import NullPie from '../NullPie'

describe('NullPie', () => {
  it('should render pie chart with both null and not null data', () => {
    const { container } = render(
      <NullPie cntNull={25} cntNotNull={75} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveStyle({ width: '36px', height: '36px' })
  })

  it('should render pie chart with only not null data', () => {
    const { container } = render(
      <NullPie cntNull={0} cntNotNull={100} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveStyle({ width: '36px', height: '36px' })
  })

  it('should render pie chart with only null data', () => {
    const { container } = render(
      <NullPie cntNull={50} cntNotNull={0} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveStyle({ width: '36px', height: '36px' })
  })

  it('should render empty state when both counts are zero', () => {
    const { container } = render(
      <NullPie cntNull={0} cntNotNull={0} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveStyle({ width: '36px', height: '36px' })
    
    // Check for the empty state indicator (rounded muted background)
    const emptyIndicator = container.querySelector('.bg-muted')
    expect(emptyIndicator).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <NullPie cntNull={25} cntNotNull={75} className="custom-pie" />
    )
    
    expect(container.firstChild).toHaveClass('custom-pie')
  })

  it('should have fixed dimensions', () => {
    const { container } = render(
      <NullPie cntNull={10} cntNotNull={90} />
    )
    
    const pieElement = container.firstChild as HTMLElement
    expect(pieElement.style.width).toBe('36px')
    expect(pieElement.style.height).toBe('36px')
  })
})