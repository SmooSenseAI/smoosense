import { render, screen, fireEvent } from '@testing-library/react'
import CellPopover from '../CellPopover'

describe('CellPopover', () => {
  const cellContent = <div>Click me</div>
  const popoverContent = <div>Popover content</div>

  it('should render cell content', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
      />
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should not show popover content initially', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
      />
    )
    
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
  })

  it('should show popover content when clicked', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
      />
    )
    
    fireEvent.click(screen.getByText('Click me'))
    expect(screen.getByText('Popover content')).toBeInTheDocument()
  })

  it('should call onOpenChange callback when popover state changes', () => {
    const onOpenChange = jest.fn()
    
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        onOpenChange={onOpenChange}
      />
    )
    
    fireEvent.click(screen.getByText('Click me'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('should render only cell content when disabled', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        disabled={true}
      />
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
    
    // Click should not trigger popover
    fireEvent.click(screen.getByText('Click me'))
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
  })

  it('should apply custom popover className', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        popoverClassName="custom-class"
      />
    )
    
    fireEvent.click(screen.getByText('Click me'))
    
    // Check if the popover content container has the custom class
    const popoverElement = screen.getByText('Popover content').closest('[role="dialog"]')
    expect(popoverElement).toHaveClass('custom-class')
  })

  it('should show copy button on hover when copyValue is provided', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        copyValue="test copy value"
      />
    )
    
    const cellElement = screen.getByText('Click me').parentElement
    
    // Copy button should not be visible initially
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    
    // Hover over the cell
    if (cellElement) {
      fireEvent.mouseEnter(cellElement)
    }
    
    // Copy button should now be visible
    expect(screen.getByRole('button')).toBeInTheDocument()
    
    // Mouse leave should hide the copy button
    if (cellElement) {
      fireEvent.mouseLeave(cellElement)
    }
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should not show copy button when copyValue is null', () => {
    render(
      <CellPopover
        cellContent={cellContent}
        popoverContent={popoverContent}
        copyValue={null}
      />
    )
    
    const cellElement = screen.getByText('Click me').parentElement
    
    // Hover over the cell
    if (cellElement) {
      fireEvent.mouseEnter(cellElement)
    }
    
    // Copy button should not be visible even on hover
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})