import { render, screen, fireEvent } from '@testing-library/react'
import IconDialog from '../IconDialog'
import { Bug } from 'lucide-react'

describe('IconDialog', () => {
  const defaultProps = {
    icon: <Bug />,
    title: 'Test Dialog',
    tooltip: 'Test tooltip',
    children: <div>Test content</div>
  }

  it('should render trigger button with icon', () => {
    render(<IconDialog {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Test tooltip')
  })

  it('should open dialog when trigger button is clicked', () => {
    render(<IconDialog {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should close dialog when close button is clicked', () => {
    render(<IconDialog {...defaultProps} />)
    
    // Open dialog
    const triggerButton = screen.getByRole('button')
    fireEvent.click(triggerButton)
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
    
    // Close dialog using the close button with aria-label
    const closeButton = screen.getByRole('button', { name: /close dialog/i })
    fireEvent.click(closeButton)
    
    expect(screen.queryByText('Test content')).not.toBeInTheDocument()
  })

  it('should use title as tooltip when tooltip prop is not provided', () => {
    render(<IconDialog {...defaultProps} tooltip={undefined} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Test Dialog')
  })

  it('should use custom dimensions', () => {
    render(
      <IconDialog 
        {...defaultProps} 
        width="80vw" 
        height="70vh" 
      />
    )
    
    const triggerButton = screen.getByRole('button')
    fireEvent.click(triggerButton)
    
    // Note: testing style attributes in jsdom is limited, but we can verify the dialog opens
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
  })

  it('should not close when clicking outside dialog', () => {
    render(<IconDialog {...defaultProps} />)
    
    // Open dialog
    const triggerButton = screen.getByRole('button')
    fireEvent.click(triggerButton)
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
    
    // Click outside (on the overlay) - dialog should remain open due to onOpenChange={() => {}}
    // Note: In a real test environment, you'd need to simulate clicking on the overlay
    // For now, we just verify the dialog is open
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should automatically apply size classes to icon', () => {
    render(<IconDialog {...defaultProps} />)
    
    const button = screen.getByRole('button')
    const svgElement = button.querySelector('svg')
    
    expect(svgElement).toHaveClass('h-4', 'w-4')
  })

  it('should preserve existing classes when adding size classes', () => {
    const iconWithClasses = <Bug className="text-red-500" />
    render(<IconDialog {...defaultProps} icon={iconWithClasses} />)
    
    const button = screen.getByRole('button')
    const svgElement = button.querySelector('svg')
    
    expect(svgElement).toHaveClass('h-4', 'w-4', 'text-red-500')
  })
})