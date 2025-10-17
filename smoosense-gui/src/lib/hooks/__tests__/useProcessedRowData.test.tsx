import React from 'react'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useProcessedRowData } from '../useProcessedRowData'
import { useRowData } from '../useRowData'
import { useImageAndVideoColumns } from '../useRenderType'

// Mock the dependencies
jest.mock('../useRowData')
jest.mock('../useRenderType')
jest.mock('../useAsyncData')

const mockUseRowData = useRowData as jest.MockedFunction<typeof useRowData>
const mockUseImageAndVideoColumns = useImageAndVideoColumns as jest.MockedFunction<typeof useImageAndVideoColumns>

// Mock useAsyncData
jest.mock('../useAsyncData', () => ({
  useAsyncData: jest.fn()
}))

import { useAsyncData } from '../useAsyncData'
const mockUseAsyncData = useAsyncData as jest.MockedFunction<typeof useAsyncData>

// Create a minimal store for testing
const createTestStore = () => {
  return configureStore({
    reducer: {
      processedRowData: (state = { data: null, loading: false, error: null, needRefresh: false }) => state,
    },
  })
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createTestStore()}>{children}</Provider>
)

describe('useProcessedRowData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array when rowData.data is empty list', () => {
    // Mock useRowData to return empty array
    mockUseRowData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    // Mock useImageAndVideoColumns to return empty array
    mockUseImageAndVideoColumns.mockReturnValue([])

    // Mock useAsyncData to return empty array when given empty rawData
    mockUseAsyncData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    const { result } = renderHook(() => useProcessedRowData(), { wrapper })

    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should call useAsyncData with correct params when rawData is empty array', () => {
    // Mock useRowData to return empty array
    mockUseRowData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    // Mock useImageAndVideoColumns
    mockUseImageAndVideoColumns.mockReturnValue(['image_col'])

    // Mock useAsyncData
    mockUseAsyncData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    renderHook(() => useProcessedRowData(), { wrapper })

    // Verify useAsyncData was called
    expect(mockUseAsyncData).toHaveBeenCalledWith({
      stateSelector: expect.any(Function),
      fetchAction: expect.any(Function),
      setNeedRefreshAction: expect.any(Function),
      buildParams: expect.any(Function),
      dependencies: [[], ['image_col']]
    })

    // Verify buildParams returns correct value for empty array
    const call = mockUseAsyncData.mock.calls[0][0]
    const buildParams = call.buildParams
    const params = buildParams()

    expect(params).toEqual({
      rawData: [],
      urlColumns: ['image_col']
    })
  })

  it('should handle loading state correctly', () => {
    // Mock useRowData to return empty array while loading (simulating data being fetched)
    mockUseRowData.mockReturnValue({
      data: [], // useRowData never returns null, always returns array
      loading: true,
      error: null,
      setNeedRefresh: jest.fn()
    })

    // Mock useImageAndVideoColumns
    mockUseImageAndVideoColumns.mockReturnValue([])

    // Mock useAsyncData to return loading state
    mockUseAsyncData.mockReturnValue({
      data: [],
      loading: true,
      error: null,
      setNeedRefresh: jest.fn()
    })

    const { result } = renderHook(() => useProcessedRowData(), { wrapper })

    // Verify the final result during loading
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(true) // Should show loading from both sources
  })

  it('should fallback to empty array when processedData is null', () => {
    // Mock useRowData to return some data
    mockUseRowData.mockReturnValue({
      data: [{ id: 1 }],
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    mockUseImageAndVideoColumns.mockReturnValue([])

    // Mock useAsyncData to return null data
    mockUseAsyncData.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    const { result } = renderHook(() => useProcessedRowData(), { wrapper })

    // Should fallback to empty array due to (processedData || [])
    expect(result.current.data).toEqual([])
  })

  it('should process empty array and return empty array', () => {
    // This is the key test case - empty filter results should be processed
    mockUseRowData.mockReturnValue({
      data: [], // Empty array from filters
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    mockUseImageAndVideoColumns.mockReturnValue(['image_col'])

    // Mock useAsyncData to simulate processing empty array and returning empty array
    mockUseAsyncData.mockReturnValue({
      data: [], // Processed empty array should still be empty array
      loading: false,
      error: null,
      setNeedRefresh: jest.fn()
    })

    const { result } = renderHook(() => useProcessedRowData(), { wrapper })

    // Verify that buildParams is called with empty array (not skipped)
    const call = mockUseAsyncData.mock.calls[0][0]
    const buildParams = call.buildParams
    const params = buildParams()

    expect(params).toEqual({
      rawData: [],
      urlColumns: ['image_col']
    })

    // Final result should be empty array
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })
})