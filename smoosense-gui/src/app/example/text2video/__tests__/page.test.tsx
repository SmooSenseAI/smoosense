import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import ExampleText2VideoPage from '../page'
import { createTestStore } from '@/lib/test-utils'

const renderWithProvider = (component: ReactElement, stateOverrides = {}) => {
  const store = createTestStore(stateOverrides)
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

// Mock AG Grid component to avoid DOM issues in tests
jest.mock('ag-grid-react', () => ({
  AgGridReact: () => <div data-testid="ag-grid">AG Grid Mock</div>
}))

// Mock react-markdown to render plain text for testing
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div dangerouslySetInnerHTML={{ __html: children.replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>') }} />
  }
})

describe('ExampleText2VideoPage', () => {
  it('should render without error', () => {
    expect(() => renderWithProvider(<ExampleText2VideoPage />)).not.toThrow()
  })

  it('should display the correct title', () => {
    const { getByRole } = renderWithProvider(<ExampleText2VideoPage />)
    expect(getByRole('heading', { name: 'Text-to-Video Comparison' })).toBeInTheDocument()
  })

  it('should display the description', () => {
    const { getByText } = renderWithProvider(<ExampleText2VideoPage />)
    expect(getByText(/SmooSense provides a platform to evaluate and compare different text-to-video AI models/)).toBeInTheDocument()
  })
})