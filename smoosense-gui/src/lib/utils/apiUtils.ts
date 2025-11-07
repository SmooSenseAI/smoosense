import { API_PREFIX } from './urlUtils'

/**
 * Make a GET API request with loading and error handling
 * @param params - Request parameters
 * @param params.relativeUrl - Relative API endpoint URL (e.g., 'parquet/info?filePath=...')
 * @param params.setData - Callback to set the data
 * @param params.setLoading - Callback to set loading state
 * @param params.setError - Callback to set error state
 */
export async function getApi({
  relativeUrl,
  setData,
  setLoading,
  setError,
}: {
  relativeUrl: string
  setData: (data: unknown) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}): Promise<void> {
  setLoading(true)
  setError(null)
  setData(null)

  // Validate relativeUrl
  if (relativeUrl.startsWith('.') || relativeUrl.startsWith('/')) {
    setError('Invalid relative URL: must not start with "." or "/"')
    setLoading(false)
    return
  }

  try {
    const url = `${API_PREFIX}/${relativeUrl}`
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      setError(errorData.error || `API request failed: ${response.statusText}`)
      return
    }

    const data = await response.json()
    setData(data)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load data')
  } finally {
    setLoading(false)
  }
}

/**
 * Make a POST API request
 * @param url - API endpoint URL
 * @param data - Request body data
 * @returns Promise<any> - API response
 */
export async function postApi({ url, data }: { url: string; data: unknown }): Promise<string[]> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Generates the API URL for getting a file from the backend
 * @param tablePath - The path to the file
 * @param redirect - Whether to redirect to signed URL (for S3 files only)
 * @returns The properly encoded API URL
 */
export function getFileUrl(tablePath: string, redirect: boolean = false): string {
  const params = new URLSearchParams({
    path: tablePath,
    redirect: redirect.toString()
  })
  return `${API_PREFIX}/get-file?${params.toString()}`
}