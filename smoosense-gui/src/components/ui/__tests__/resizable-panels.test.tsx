import { render } from '@testing-library/react'
import { ResizablePanels } from '../resizable-panels'

describe('ResizablePanels', () => {
  it('should render without error', () => {
    expect(() => 
      render(
        <ResizablePanels>
          <div>Panel 1</div>
          <div>Panel 2</div>
        </ResizablePanels>
      )
    ).not.toThrow()
  })

  it('should render both panels', () => {
    const { getByText } = render(
      <ResizablePanels>
        <div>Panel 1</div>
        <div>Panel 2</div>
      </ResizablePanels>
    )

    expect(getByText('Panel 1')).toBeInTheDocument()
    expect(getByText('Panel 2')).toBeInTheDocument()
  })
})