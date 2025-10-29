'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { pathBasename } from '@/lib/utils/pathUtils'
import FolderBrowserNavbar from '@/components/layout/FolderBrowserNavbar'
import DBContent from '@/components/db/DBContent'

function DBPageContent() {
  const searchParams = useSearchParams()
  const rootFolder = searchParams.get('rootFolder')

  // Set document title based on rootFolder
  useEffect(() => {
    if (rootFolder) {
      const folderName = pathBasename(rootFolder)
      document.title = `${folderName} - Lance DB` || 'SmooSense - Lance DB'
    } else {
      document.title = 'SmooSense - Lance DB'
    }
  }, [rootFolder])

  // If rootFolder is missing, show error
  if (!rootFolder) {
    return (
      <div className="min-h-screen bg-background">
        <FolderBrowserNavbar />
        <main className="h-[calc(100vh-56px)]">
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-4xl font-bold text-destructive">
                Error: Missing Database Path
              </h1>
              <p className="text-lg text-muted-foreground text-center max-w-md">
                This page requires a <code className="bg-muted px-2 py-1 rounded">rootFolder</code> parameter in the URL.
              </p>
              <p className="text-sm text-muted-foreground">
                Example: <code className="bg-muted px-2 py-1 rounded">/DB?rootFolder=~/data/lance</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <FolderBrowserNavbar />
      <main className="h-[calc(100vh-56px)]">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <DBContent rootFolder={rootFolder} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DB() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DBPageContent />
    </Suspense>
  )
}
