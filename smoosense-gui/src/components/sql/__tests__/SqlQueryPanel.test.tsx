import { render, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import SqlQueryPanel from '../SqlQueryPanel'
import { createTestStore } from '@/lib/test-utils'


const renderWithProvider = (component: ReactElement) => {
  const store = createTestStore({ ui: { filePath: '/test/file.csv' } })
  return act(() => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    )
  })
}

// Mock fetch
global.fetch = jest.fn()

describe('SqlQueryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error', () => {
    expect(() => renderWithProvider(<SqlQueryPanel />)).not.toThrow()
  })
})