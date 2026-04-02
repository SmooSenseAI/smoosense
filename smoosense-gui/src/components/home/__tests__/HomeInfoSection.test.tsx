// smoosense-gui/src/components/home/__tests__/HomeInfoSection.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import HomeInfoSection from '../HomeInfoSection'
import * as pathUtils from '@/lib/utils/pathUtils'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock pathUtils so isRunningLocal can be controlled per test
jest.mock('@/lib/utils/pathUtils', () => ({
  ...jest.requireActual('@/lib/utils/pathUtils'),
  isRunningLocal: jest.fn(),
}))

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>)
}

type WindowWithConfig = Window & { LOCAL_FOLDER_PREFIX?: string | null }

describe('HomeInfoSection — local folder access messages', () => {
  afterEach(() => {
    delete (window as WindowWithConfig).LOCAL_FOLDER_PREFIX
    jest.clearAllMocks()
  })

  it('allows local path when LOCAL_FOLDER_PREFIX is null and running on localhost', async () => {
    ;(pathUtils.isRunningLocal as jest.Mock).mockReturnValue(true)
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = null
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.queryByText(/not supported on this server/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/must start with/i)).not.toBeInTheDocument()
  })

  it('shows "not supported" when LOCAL_FOLDER_PREFIX is null and not on localhost', async () => {
    ;(pathUtils.isRunningLocal as jest.Mock).mockReturnValue(false)
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = null
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/not supported on this server/i)).toBeInTheDocument()
  })

  it('shows "not supported" error when LOCAL_FOLDER_PREFIX is "" (explicit deny)', async () => {
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = ''
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/not supported on this server/i)).toBeInTheDocument()
  })

  it('shows pattern-specific error when LOCAL_FOLDER_PREFIX is set', async () => {
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = '/mnt/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/must start with \/mnt\//i)).toBeInTheDocument()
  })

  it('shows generic local error when LOCAL_FOLDER_PREFIX is "/"', async () => {
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = '/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'not-a-valid-path')
    expect(screen.getByText(/must start with \/, ~, or s3:\/\//i)).toBeInTheDocument()
  })

  it('allows local path when LOCAL_FOLDER_PREFIX is "/" (no error shown)', async () => {
    ;(window as WindowWithConfig).LOCAL_FOLDER_PREFIX = '/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/any/path')
    expect(screen.queryByText(/must start with/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not supported/i)).not.toBeInTheDocument()
  })
})
