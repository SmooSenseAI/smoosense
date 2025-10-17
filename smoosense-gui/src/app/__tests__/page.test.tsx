import { render, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import Home from '../page'
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
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))


describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without error', () => {
    expect(() => renderWithProvider(<Home />)).not.toThrow()
  })
})