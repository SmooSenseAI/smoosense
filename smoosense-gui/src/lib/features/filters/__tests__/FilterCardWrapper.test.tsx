import { render, screen } from '@testing-library/react'
import FilterCardWrapper from '../FilterCardWrapper'

describe('FilterCardWrapper', () => {
  const mockProps = {
    columnName: 'test_column',
    isLoading: false,
    error: null,
    hasData: true,
    children: <div>Filter content</div>
  }

  it('should render children when data is available', () => {
    render(<FilterCardWrapper {...mockProps} />)
    
    expect(screen.getByText('Filter content')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(
      <FilterCardWrapper 
        {...mockProps} 
        isLoading={true}
      />
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByText('test_column')).toBeInTheDocument()
    expect(screen.getByText('Loading statistics...')).toBeInTheDocument()
    expect(screen.queryByText('Filter content')).not.toBeInTheDocument()
  })

  it('should show error state', () => {
    render(
      <FilterCardWrapper 
        {...mockProps} 
        error="Database connection failed"
      />
    )
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('test_column')).toBeInTheDocument()
    expect(screen.getByText('Error: Database connection failed')).toBeInTheDocument()
    expect(screen.queryByText('Filter content')).not.toBeInTheDocument()
  })

  it('should show no data state', () => {
    render(
      <FilterCardWrapper 
        {...mockProps} 
        hasData={false}
      />
    )
    
    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('test_column')).toBeInTheDocument()
    expect(screen.getByText('No statistics available')).toBeInTheDocument()
    expect(screen.queryByText('Filter content')).not.toBeInTheDocument()
  })

  it('should prioritize loading state over error state', () => {
    render(
      <FilterCardWrapper 
        {...mockProps} 
        isLoading={true}
        error="Some error"
      />
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
  })

  it('should prioritize error state over no data state', () => {
    render(
      <FilterCardWrapper 
        {...mockProps} 
        error="Some error"
        hasData={false}
      />
    )
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.queryByText('No Data')).not.toBeInTheDocument()
  })

  it('should wrap children in min-w-400px container', () => {
    const { container } = render(<FilterCardWrapper {...mockProps} />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('min-w-[400px]')
  })
})