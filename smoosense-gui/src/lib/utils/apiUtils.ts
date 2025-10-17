import { API_PREFIX } from './urlUtils'

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
 * @param filePath - The path to the file
 * @param redirect - Whether to redirect to signed URL (for S3 files only)
 * @returns The properly encoded API URL
 */
export function getFileUrl(filePath: string, redirect: boolean = false): string {
  const params = new URLSearchParams({
    path: filePath,
    redirect: redirect.toString()
  })
  return `${API_PREFIX}/get-file?${params.toString()}`
}