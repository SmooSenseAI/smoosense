import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import DebugStateViewer from '../DebugStateViewer'
import { createTestStore } from '@/lib/test-utils'

const renderWithProvider = (stateOverrides = {}) => {
  const store = createTestStore({
    ui: {
      debugMode: true,
      filePath: '/test/file.csv',
      ...stateOverrides,
    },
  })
  
  return render(
    <Provider store={store}>
      <DebugStateViewer />
    </Provider>
  )
}

describe('DebugStateViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render debug button', () => {
    renderWithProvider()
    
    // Find the debug button by its title attribute
    const debugButton = screen.getByTitle('Debug Redux State')
    expect(debugButton).toBeInTheDocument()
  })

  it('should render without error', () => {
    expect(() => renderWithProvider()).not.toThrow()
  })
})