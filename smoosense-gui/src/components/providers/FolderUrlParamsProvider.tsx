'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/lib/hooks'
import { setRootFolder, setBaseUrl } from '@/lib/features/ui/uiSlice'
import { setViewingId, loadFolderContents, expandNode } from '@/lib/features/folderTree/folderTreeSlice'
import { pathJoin, pathParent } from '@/lib/utils/pathUtils'
import type { AppDispatch } from '@/lib/store'

// Recursively ensure a path and all its ancestors are expanded
// To expand path P, we must first expand its parent, and to expand the parent, we must expand the grandparent, etc.
async function expandTreeToViewing(
  dispatch: AppDispatch,
  urlRootFolder: string,
  viewing: string
): Promise<void> {
  // Build the full path for the viewing item
  const fullPath = pathJoin(urlRootFolder, viewing)
  dispatch(setViewingId(fullPath))

  const ensurePathExpanded = async (path: string): Promise<void> => {

    // Base case: if this is the root folder, load and expand it
    if (path === urlRootFolder) {
      await dispatch(loadFolderContents({ path: urlRootFolder })).unwrap()
      dispatch(expandNode(urlRootFolder))
      return
    } else {
      const parent = pathParent(path)

      // If no valid parent, load and expand root
      if (!parent || parent === path || parent === '') {
        await dispatch(loadFolderContents({ path: urlRootFolder })).unwrap()
        dispatch(expandNode(urlRootFolder))
        return
      }

      // Recursive case: ensure parent is expanded first
      await ensurePathExpanded(parent)
      // Load this path's contents
      await dispatch(loadFolderContents({ path })).unwrap()
      // Expand this path (so its children can be visible)
      dispatch(expandNode(path))
    }
  }

  try {
    // Ensure the viewing target and all its ancestors are expanded
    await ensurePathExpanded(fullPath)
  } catch (error) {
    console.error('Failed to expand tree to viewing path:', error)
  }
}

function FolderUrlParamsProviderInner({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Extract and set baseUrl (remove trailing slash and last segment from pathname)
    if (typeof window !== 'undefined') {
      let pathname = window.location.pathname

      // Remove trailing slash if present
      if (pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1)
      }

      // Remove the last segment (e.g., /FolderBrowser)
      const lastSlashIndex = pathname.lastIndexOf('/')
      const pathWithoutLastSegment = lastSlashIndex > 0 ? pathname.substring(0, lastSlashIndex) : ''

      const baseUrl = window.location.origin + pathWithoutLastSegment
      dispatch(setBaseUrl(baseUrl))
    }

    const urlRootFolder = searchParams.get('rootFolder')
    const viewing = searchParams.get('viewing')

    dispatch(setRootFolder(urlRootFolder))

    // If viewing parameter is provided and not empty, expand tree to reach it
    if (viewing && viewing.trim() !== '' && urlRootFolder) {
      expandTreeToViewing(dispatch, urlRootFolder, viewing)
    }
  }, [searchParams, dispatch])

  return <>{children}</>
}

export default function FolderUrlParamsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FolderUrlParamsProviderInner>{children}</FolderUrlParamsProviderInner>
    </Suspense>
  )
}