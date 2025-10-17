import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ReactElement } from 'react'
import GlobalSettingsDropdown from '../GlobalSettings'
import { createTestStore } from '@/lib/test-utils'

// Mock ResizeObserver for testing
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const renderWithProvider = (component: ReactElement, stateOverrides = {}) => {
  const store = createTestStore(stateOverrides)
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('GlobalSettingsDropdown', () => {
  it('renders trigger button without crashing', () => {
    renderWithProvider(<GlobalSettingsDropdown />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('GlobalSettingsDropdown with context', () => {
  it('renders with Table context', () => {
    renderWithProvider(<GlobalSettingsDropdown context="Table" />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders with FolderBrowser context', () => {
    renderWithProvider(<GlobalSettingsDropdown context="FolderBrowser" />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders without context', () => {
    renderWithProvider(<GlobalSettingsDropdown />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})