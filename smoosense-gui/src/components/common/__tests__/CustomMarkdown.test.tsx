import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createTestStore } from '@/lib/test-utils'
import CustomMarkdown from '../CustomMarkdown'

// react-markdown is mocked (returns children as-is), so custom component
// handlers won't be invoked. Tests cover the context wiring and TOC behavior.

const store = createTestStore()

function renderMd(content: string, props: Partial<{ disableTOC: boolean }> = {}) {
  return render(
    <Provider store={store}>
      <CustomMarkdown {...props}>{content}</CustomMarkdown>
    </Provider>
  )
}

describe('CustomMarkdown', () => {
  it('renders without errors for plain text', () => {
    renderMd('Hello world')
    expect(document.body).toBeInTheDocument()
  })

  it('shows TOC toggle button when headings are present', () => {
    renderMd('# Introduction\n## Background')
    expect(screen.getByLabelText('Toggle table of contents')).toBeInTheDocument()
  })

  it('does not show TOC button when disableTOC is true', () => {
    renderMd('# Introduction', { disableTOC: true })
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('does not show TOC button when no headings in markdown', () => {
    renderMd('Just some text without headings.')
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('opens TOC panel and shows heading entries when toggle is clicked', () => {
    renderMd('# Hello\n## World')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })
})
