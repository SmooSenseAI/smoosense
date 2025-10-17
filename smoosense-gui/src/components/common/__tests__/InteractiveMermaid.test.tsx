import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import InteractiveMermaid from '../InteractiveMermaid'

// Mock mermaid is already handled by jest.config.js

describe('InteractiveMermaid', () => {
  const mockDefinition = `
    graph TB
      A[Node A]
      B[Node B]
      A --> B
  `

  it('should render with basic definition', () => {
    render(
      <InteractiveMermaid 
        definition={mockDefinition}
      />
    )
    
    // Should render without errors
    expect(document.querySelector('[class*="w-full h-full"]')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(
      <InteractiveMermaid 
        definition={mockDefinition}
        className="custom-class"
      />
    )
    
    // Should render without errors
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })
})