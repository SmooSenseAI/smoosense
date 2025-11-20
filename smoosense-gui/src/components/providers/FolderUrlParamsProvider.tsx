'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/lib/hooks'
import { setRootFolder, setBaseUrl } from '@/lib/features/ui/uiSlice'
import { setViewingId, loadFolderContents, expandNode, type FSItem } from '@/lib/features/folderTree/folderTreeSlice'
import { pathJoin, pathParent, pathBasename } from '@/lib/utils/pathUtils'
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

  // Returns the loaded items for the path, or null if it's a file
  const ensurePathExpanded = async (path: string): Promise<FSItem[] | null> => {
    // Base case: if this is the root folder, load and expand it
    if (path === urlRootFolder) {
      const result = await dispatch(loadFolderContents({ path: urlRootFolder })).unwrap()
      dispatch(expandNode(urlRootFolder))
      return result.items
    }

    const parent = pathParent(path)

    // If no valid parent, load and expand root
    if (!parent || parent === path || parent === '') {
      const result = await dispatch(loadFolderContents({ path: urlRootFolder })).unwrap()
      dispatch(expandNode(urlRootFolder))
      return result.items
    }

    // Recursive case: ensure parent is expanded first
    const parentItems = await ensurePathExpanded(parent)

    // Check if current path is a directory based on parent's loaded items
    const itemName = pathBasename(path)
    const currentItem = parentItems?.find(item => item.name === itemName)

    if (currentItem?.isDir) {
      // It's a directory, load its contents and expand it
      const result = await dispatch(loadFolderContents({ path })).unwrap()
      dispatch(expandNode(path))
      return result.items
    }

    // It's a file or not found, don't try to load
    return null
  }

  try {
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