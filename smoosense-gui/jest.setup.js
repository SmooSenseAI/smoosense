import '@testing-library/jest-dom'

// Mock ResizeObserver for Recharts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock all async Redux thunks to prevent act() warnings
jest.mock('./src/lib/hooks/useColumnMeta', () => ({
  useColumnMeta: jest.fn(() => ({
    columns: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

// Global mock for localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

// Global mock for Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))