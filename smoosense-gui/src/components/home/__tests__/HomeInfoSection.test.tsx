// smoosense-gui/src/components/home/__tests__/HomeInfoSection.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import HomeInfoSection from '../HomeInfoSection'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>)
}

describe('HomeInfoSection — local folder access messages', () => {
  afterEach(() => {
    // Reset window globals between tests
    delete (window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN
  })

  it('allows local path when LOCAL_FOLDER_PATTERN is null (default: allow all)', async () => {
    ;(window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN = null
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.queryByText(/not supported on this server/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/must start with/i)).not.toBeInTheDocument()
  })

  it('shows "not supported" error when LOCAL_FOLDER_PATTERN is "" (explicit deny)', async () => {
    ;(window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN = ''
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/not supported on this server/i)).toBeInTheDocument()
  })

  it('shows pattern-specific error when LOCAL_FOLDER_PATTERN is set', async () => {
    ;(window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN = '/mnt/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/must start with \/mnt\//i)).toBeInTheDocument()
  })

  it('shows generic local error when LOCAL_FOLDER_PATTERN is "/"', async () => {
    ;(window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN = '/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'not-a-valid-path')
    expect(screen.getByText(/must start with \/, ~, or s3:\/\//i)).toBeInTheDocument()
  })

  it('allows local path when LOCAL_FOLDER_PATTERN is "/" (no error shown)', async () => {
    ;(window as Window & { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN = '/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/any/path')
    expect(screen.queryByText(/must start with/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not supported/i)).not.toBeInTheDocument()
  })
})
