'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/lib/hooks'
import { pathBasename } from '@/lib/utils/pathUtils'
import FolderBrowserNavbar from '@/components/layout/FolderBrowserNavbar'
import FolderUrlParamsProvider from '@/components/providers/FolderUrlParamsProvider'
import FolderBrowserTabContent from '@/components/folder-browser/FolderBrowserTabContent'

function FolderBrowserContent() {
  const searchParams = useSearchParams()
  const rootFolder = useAppSelector((state) => state.ui.rootFolder)
  const urlRootFolder = searchParams.get('rootFolder')

  // Set document title based on rootFolder
  useEffect(() => {
    const currentPath = rootFolder || urlRootFolder
    if (currentPath) {
      const folderName = pathBasename(currentPath)
      document.title = folderName || 'SmooSense'
    } else {
      document.title = 'SmooSense'
    }
  }, [rootFolder, urlRootFolder])

  // If both rootFolder and urlRootFolder are nil, show error
  if (!rootFolder && !urlRootFolder) {
    return (
      <div className="min-h-screen bg-background">
        <FolderBrowserNavbar />
        <main className="h-[calc(100vh-56px)]">
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-4xl font-bold text-destructive">
                Error: Missing Folder Path
              </h1>
              <p className="text-lg text-muted-foreground text-center max-w-md">
                This page requires a <code className="bg-muted px-2 py-1 rounded">rootFolder</code> parameter in the URL.
              </p>
              <p className="text-sm text-muted-foreground">
                Example: <code className="bg-muted px-2 py-1 rounded">/FolderBrowser?rootFolder=~/Documents</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // If rootFolder is nil but urlRootFolder exists, show loading
  if (!rootFolder && urlRootFolder) {
    return (
      <div className="min-h-screen bg-background">
        <FolderBrowserNavbar />
        <main className="h-[calc(100vh-56px)]">
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-muted-foreground">Loading...</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 ml-4">
              Processing folder path: <code className="bg-muted px-2 py-1 rounded">{urlRootFolder}</code>
            </p>
          </div>
        </main>
      </div>
    )
  }

  // If rootFolder exists, use it
  return (
    <div className="min-h-screen bg-background">
      <FolderBrowserNavbar />
      <main className="h-[calc(100vh-56px)]">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <FolderBrowserTabContent />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function FolderBrowser() {
  return (
    <FolderUrlParamsProvider>
      <FolderBrowserContent />
    </FolderUrlParamsProvider>
  )
}