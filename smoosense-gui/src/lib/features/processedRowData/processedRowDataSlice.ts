import {type BaseAsyncDataState, createAsyncDataSlice} from '@/lib/utils/createAsyncDataSlice'
import {API_PREFIX} from '@/lib/utils/urlUtils'
import {pathDirname, pathJoin} from '@/lib/utils/pathUtils'
import {cloneDeep, isNil} from 'lodash'

export type ProcessedRowDataState = BaseAsyncDataState<Record<string, unknown>[]>

interface FetchProcessedRowDataParams {
  rawData: Record<string, unknown>[]
  urlColumns: string[]
}

/**
 * Convert a file path to a URL, handling relative paths and baseUrl
 * @param url - The URL or file path to convert
 * @param filePath - The current file path (for resolving relative paths like ./)
 * @param baseUrl - The base URL to prepend (for absolute paths like / or ~/)
 * @returns The converted URL
 */
export const filePathToUrl = (url: string, filePath: string, baseUrl: string): string => {
  let fullUrl = url

  // If URL starts with "./", resolve it relative to filePath
  if (url.startsWith('./')) {
    const dirPath = pathDirname(filePath)
    const relativePath = url.substring(2) // Remove './' prefix
    fullUrl = pathJoin(dirPath, relativePath)
  }

  // If URL starts with '/' or '~/', convert to API endpoint
  if (fullUrl.startsWith('/') || fullUrl.startsWith('~/')) {
    const params = new URLSearchParams({
      path: fullUrl,
      redirect: 'false'
    })
    const relativeUrl = `${API_PREFIX}/get-file?${params.toString()}`

    // Prepend baseUrl
    return baseUrl + '/' + relativeUrl
  }

  // Return unchanged for absolute URLs (http://, https://, s3://, etc.)
  return fullUrl
}

// Processed row data fetch function
const fetchProcessedRowDataFunction = async (
  { rawData, urlColumns }: FetchProcessedRowDataParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState?: any
): Promise<Record<string, unknown>[]> => {
  if (!rawData || rawData.length === 0) {
    return []
  }

  let processedRowData = [...rawData]

  // 1. Convert relative URLs to absolute URLs using baseUrl and filePath
  if (urlColumns && urlColumns.length > 0 && getState) {
    const state = getState()
    const filePath = state.ui?.filePath
    const baseUrl = state.ui?.baseUrl

    // Only process if both filePath and baseUrl are available
    if (filePath && baseUrl) {
      // Clone the data to avoid mutation
      processedRowData = cloneDeep(processedRowData)

      // Convert relative URLs for each URL column
      processedRowData.forEach((row) => {
        urlColumns.forEach((col) => {
          const value = row[col]
          if (value && typeof value === 'string') {
            // Use filePathToUrl to convert relative URLs to absolute URLs
            row[col] = filePathToUrl(value, filePath, baseUrl)
          }
        })
      })
    }
  }


  return processedRowData
}

// Should wait condition - check if rawData is provided
const processedRowDataShouldWait = ({ rawData }: FetchProcessedRowDataParams) => {
  return !isNil(rawData)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<Record<string, unknown>[], FetchProcessedRowDataParams>({
  name: 'processedRowData',
  fetchFunction: fetchProcessedRowDataFunction,
  shouldWait: processedRowDataShouldWait,
  errorMessage: 'Failed to process row data'
})

export const processedRowDataSlice = sliceResult.slice
export const fetchProcessedRowData = sliceResult.fetchThunk
export const { clearProcessedRowData, setProcessedRowDataError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer