import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import ExampleObjectDetectionPage from '../page'
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

describe('ExampleObjectDetectionPage', () => {
  it('should render without error', () => {
    expect(() => renderWithProvider(<ExampleObjectDetectionPage />)).not.toThrow()
  })

  it('should display the correct title', () => {
    const { getByRole } = renderWithProvider(<ExampleObjectDetectionPage />)
    expect(getByRole('heading', { name: 'Object Detection Analysis' })).toBeInTheDocument()
  })

  it('should display the description', () => {
    const { getByText } = renderWithProvider(<ExampleObjectDetectionPage />)
    expect(getByText(/SmooSense helps evaluate object detection models/)).toBeInTheDocument()
  })
})