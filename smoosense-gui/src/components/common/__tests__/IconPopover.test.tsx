import { render, screen } from '@testing-library/react'
import IconPopover from '../IconPopover'
import { Settings } from 'lucide-react'

describe('IconPopover', () => {
  it('renders without crashing', () => {
    render(
      <IconPopover icon={<Settings />} tooltip="Settings">
        <div>Test content</div>
      </IconPopover>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(
      <IconPopover 
        icon={<Settings />} 
        title="Settings"
      >
        <div>Test content</div>
      </IconPopover>
    )
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders with tooltip', () => {
    render(
      <IconPopover 
        icon={<Settings />} 
        tooltip="Settings tooltip"
      >
        <div>Test content</div>
      </IconPopover>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Settings tooltip')
  })

  it('applies custom button className', () => {
    render(
      <IconPopover 
        icon={<Settings />} 
        buttonClassName="custom-class"
      >
        <div>Test content</div>
      </IconPopover>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})