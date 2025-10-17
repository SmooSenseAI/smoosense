import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import ExampleText2ImagePage from '../page'
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

describe('ExampleText2ImagePage', () => {
  it('should render without error', () => {
    expect(() => renderWithProvider(<ExampleText2ImagePage />)).not.toThrow()
  })

  it('should display the correct title', () => {
    const { getByRole } = renderWithProvider(<ExampleText2ImagePage />)
    expect(getByRole('heading', { name: 'Text-to-Image Alignment' })).toBeInTheDocument()
  })

  it('should display the description', () => {
    const { getByText } = renderWithProvider(<ExampleText2ImagePage />)
    expect(getByText(/SmooSense allows users to visualize and evaluate text-to-image AI performance/)).toBeInTheDocument()
  })
})