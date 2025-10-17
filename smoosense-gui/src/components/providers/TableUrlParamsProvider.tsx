'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import * as uiSliceActions from '@/lib/features/ui/uiSlice'

function TableUrlParamsProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const currentFilePath = useAppSelector((state) => state.ui.filePath)


  useEffect(() => {
    // Extract and set baseUrl (remove trailing slash and last segment from pathname)
    if (typeof window !== 'undefined') {
      let pathname = window.location.pathname

      // Remove trailing slash if present
      if (pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1)
      }

      // Remove the last segment (e.g., /Table)
      const lastSlashIndex = pathname.lastIndexOf('/')
      const pathWithoutLastSegment = lastSlashIndex > 0 ? pathname.substring(0, lastSlashIndex) : ''

      const baseUrl = window.location.origin + pathWithoutLastSegment
      dispatch(uiSliceActions.setBaseUrl(baseUrl))
    }

    // Handle filePath specifically
    const filePath = searchParams.get('filePath')
    if (filePath !== currentFilePath) {
      dispatch(uiSliceActions.setFilePath(filePath))

      // Set root folder to the directory containing the file
      if (filePath) {
        const folderPath = filePath.substring(0, filePath.lastIndexOf('/'))
        dispatch(uiSliceActions.setRootFolder(folderPath || '/'))
      }
    }

    // Collect all other URL parameters and batch update UI slice
    const batchUpdates: Record<string, unknown> = {}

    // Check if searchParams has forEach method (URLSearchParams) or handle as mock object
    if (searchParams && typeof searchParams.forEach === 'function') {
      searchParams.forEach((value, key) => {
        if (key !== 'filePath') {
          try {
            // Try to parse value based on expected type
            let parsedValue: unknown = value

            // Handle boolean values
            if (value === 'true' || value === 'false') {
              parsedValue = value === 'true'
            }
            // Handle numeric values
            else if (!isNaN(Number(value)) && value !== '') {
              parsedValue = Number(value)
            }
            // Handle array values (comma-separated)
            else if (value.includes(',')) {
              parsedValue = value.split(',')
            }
            // Handle null/undefined
            else if (value === 'null' || value === 'undefined') {
              parsedValue = null
            }

            batchUpdates[key] = parsedValue
          } catch (error) {
            console.warn(`Failed to parse UI parameter ${key}:`, error)
          }
        }
      })
    }

    // Apply batch updates if there are any
    if (Object.keys(batchUpdates).length > 0) {
      dispatch(uiSliceActions.setBatchUISettings(batchUpdates))
    }
  }, [searchParams, dispatch, currentFilePath])

  return <>{children}</>
}

export default function TableUrlParamsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TableUrlParamsProviderInner>{children}</TableUrlParamsProviderInner>
    </Suspense>
  )
}