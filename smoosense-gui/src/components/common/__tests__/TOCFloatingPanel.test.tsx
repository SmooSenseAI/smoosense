import { render, screen, fireEvent } from '@testing-library/react'
import { MarkdownProvider } from '../MarkdownContext'
import TOCFloatingPanel from '../TOCFloatingPanel'

function renderPanel(markdown: string) {
  return render(
    <MarkdownProvider markdown={markdown}>
      <TOCFloatingPanel />
    </MarkdownProvider>
  )
}

describe('TOCFloatingPanel', () => {
  it('does not render toggle button when markdown has no headings', () => {
    renderPanel('Just some plain text.')
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('renders toggle button when headings are present', () => {
    renderPanel('# Hello\n## World')
    expect(screen.getByLabelText('Toggle table of contents')).toBeInTheDocument()
  })

  it('does not show panel before toggle button is clicked', () => {
    renderPanel('# Hello')
    expect(screen.queryByText('Contents')).not.toBeInTheDocument()
  })

  it('shows panel with heading entries after toggle button is clicked', () => {
    renderPanel('# Introduction\n## Background')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Contents')).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Background')).toBeInTheDocument()
  })

  it('closes panel when close button is clicked', () => {
    renderPanel('# Hello')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Contents')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close table of contents'))
    expect(screen.queryByText('Contents')).not.toBeInTheDocument()
  })

  it('shows section numbers alongside heading text', () => {
    renderPanel('# Title\n## First\n### Sub')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('1')).toBeInTheDocument()    // h2
    expect(screen.getByText('1.1')).toBeInTheDocument()  // h3
  })
})
