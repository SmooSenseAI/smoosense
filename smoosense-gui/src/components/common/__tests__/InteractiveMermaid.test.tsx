import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import mermaid from 'mermaid'
import InteractiveMermaid from '../InteractiveMermaid'

beforeEach(() => {
  (mermaid.render as jest.Mock).mockClear()
})

describe('InteractiveMermaid', () => {
  const mockDefinition = `
    graph TB
      A[Node A]
      B[Node B]
      A --> B
  `

  it('should render with basic definition', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    expect(document.querySelector('[class*="w-full h-full"]')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<InteractiveMermaid definition={mockDefinition} className="custom-class" />)
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should replace literal \\n with <br> before passing to mermaid.render', async () => {
    const mockRender = mermaid.render as jest.Mock
    render(
      // \\n in the string literal is the two-character sequence backslash+n (not a real newline)
      <InteractiveMermaid definition={'graph TB\n  A["Line1\\nLine2"] --> B'} />
    )
    await waitFor(() => {
      expect(mockRender).toHaveBeenCalled()
    })
    const calledWith = mockRender.mock.calls[0][1] as string
    expect(calledWith).toContain('<br>')
    expect(calledWith).not.toContain('\\n')
  })

  it('should render an expand button', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    expect(screen.getByRole('button', { name: /expand chart/i })).toBeInTheDocument()
  })

  it('should open a dialog when the expand button is clicked', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    fireEvent.click(screen.getByRole('button', { name: /expand chart/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should close the dialog when the close button is clicked', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    fireEvent.click(screen.getByRole('button', { name: /expand chart/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should not render an expand button when expanded prop is true', () => {
    render(<InteractiveMermaid definition={mockDefinition} expanded />)
    expect(
      screen.queryByRole('button', { name: /expand chart/i })
    ).not.toBeInTheDocument()
  })
})