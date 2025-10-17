import { configureStore } from '@reduxjs/toolkit'
import processedRowDataReducer, { fetchProcessedRowData, filePathToUrl, type ProcessedRowDataState } from '../processedRowDataSlice'

// Mock the dependencies
jest.mock('@/lib/utils/urlUtils', () => ({
  proxyAllUrlsInRowData: jest.fn(({ rowData }) => Promise.resolve(rowData)),
  API_PREFIX: './api'
}))

jest.mock('@/lib/utils/derivedColumnUtils', () => ({
  evaluateAllExpressionsForAllRows: jest.fn(({ rowData }) => Promise.resolve(rowData))
}))

interface TestStore {
  processedRowData: ProcessedRowDataState
  derivedColumns: { columns: unknown[] }
}

describe('processedRowDataSlice', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any

  beforeEach(() => {
    store = configureStore({
      reducer: {
        processedRowData: processedRowDataReducer,
        derivedColumns: () => ({ columns: [] })
      }
    })
  })

  it('should handle initial state', () => {
    const state = (store.getState() as TestStore).processedRowData
    expect(state.data).toBeNull()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.needRefresh).toBe(false)
  })

  it('should handle fetch with empty data', async () => {
    const result = await store.dispatch(fetchProcessedRowData({ rawData: [], urlColumns: [] }))
    
    // Should not dispatch due to shouldWait condition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).meta.requestStatus).toBe('fulfilled')
  })

  it('should handle fetch with valid data', async () => {
    const testData = [{ id: 1, name: 'test' }]
    const urlColumns = ['image_url']
    
    const result = await store.dispatch(fetchProcessedRowData({ rawData: testData, urlColumns }))
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).meta.requestStatus).toBe('fulfilled')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).payload).toEqual(testData)
    
    const state = (store.getState() as TestStore).processedRowData
    expect(state.data).toEqual(testData)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })
})

describe('filePathToUrl', () => {
  const baseUrl = 'http://localhost:8001'
  const filePath = '/data/folder/file.parquet'

  describe('relative URLs starting with ./', () => {
    it('should resolve relative URL with filePath', () => {
      const url = './images/photo.jpg'
      const expected = './api/get-file?path=%2Fdata%2Ffolder%2Fimages%2Fphoto.jpg&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with nested path', () => {
      const url = './subfolder/nested/file.txt'
      const expected = './api/get-file?path=%2Fdata%2Ffolder%2Fsubfolder%2Fnested%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with parent directory', () => {
      const url = './../other/file.txt'
      const expected = './api/get-file?path=%2Fdata%2Ffolder%2F..%2Fother%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('absolute file paths starting with /', () => {
    it('should convert absolute path to API URL with baseUrl', () => {
      const url = '/data/images/photo.jpg'
      const expected = './api/get-file?path=%2Fdata%2Fimages%2Fphoto.jpg&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle paths with spaces', () => {
      const url = '/data/path with spaces/file.txt'
      const expected = './api/get-file?path=%2Fdata%2Fpath+with+spaces%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle paths with special characters', () => {
      const url = '/data/file@#$%.txt'
      const expected = './api/get-file?path=%2Fdata%2Ffile%40%23%24%25.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('home directory paths starting with ~/', () => {
    it('should convert home path to API URL with baseUrl', () => {
      const url = '~/Documents/file.txt'
      const expected = './api/get-file?path=%7E%2FDocuments%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle home path with nested folders', () => {
      const url = '~/folder/subfolder/file.txt'
      const expected = './api/get-file?path=%7E%2Ffolder%2Fsubfolder%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('absolute URLs', () => {
    it('should return HTTP URL unchanged', () => {
      const url = 'http://example.com/image.jpg'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })

    it('should return HTTPS URL unchanged', () => {
      const url = 'https://example.com/image.jpg'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })

    it('should return S3 URL unchanged', () => {
      const url = 's3://bucket/folder/file.txt'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })

    it('should return other protocol URLs unchanged', () => {
      const url = 'ftp://server/file.txt'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })

    it('should return data URLs unchanged', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })
  })

  describe('edge cases', () => {
    it('should handle root path /', () => {
      const url = '/'
      const expected = './api/get-file?path=%2F&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle single file in root', () => {
      const url = '/file.txt'
      const expected = './api/get-file?path=%2Ffile.txt&redirect=false'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle URL with query parameters (absolute URL)', () => {
      const url = 'https://example.com/image.jpg?size=large'
      expect(filePathToUrl(url, filePath, baseUrl)).toBe(url)
    })
  })
})