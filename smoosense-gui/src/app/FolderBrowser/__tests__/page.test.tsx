import { render, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import FolderBrowser from '../page'
import { createTestStore } from '@/lib/test-utils'


const renderWithProvider = (component: ReactElement) => {
  return act(() => {
    return render(
      <Provider store={createTestStore()}>
        {component}
      </Provider>
    )
  })
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/FolderBrowser',
  useSearchParams: () => new URLSearchParams(),
}))


describe('FolderBrowser Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error', () => {
    expect(() => renderWithProvider(<FolderBrowser />)).not.toThrow()
  })
})