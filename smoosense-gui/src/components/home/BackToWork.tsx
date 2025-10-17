'use client'

import Link from 'next/link'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Folder, Table } from 'lucide-react'
import type { RootState } from '@/lib/store'

export default function BackToWork() {
  const rootFolder = useSelector((state: RootState) => state.ui.rootFolder)
  const filePath = useSelector((state: RootState) => state.ui.filePath)

  // Get basename from path
  const pathBasename = (path: string) => {
    return path.split('/').pop() || path
  }

  // Don't render if no work to return to
  if (!rootFolder && !filePath) {
    return null
  }

  return (
    <div className="max-w-4xl w-full flex flex-col items-left space-y-6 mb-12">
      <h2 className="text-xl font-semibold text-foreground">Back to work</h2>
      <div className="flex flex-row items-center space-x-4">
        {rootFolder && (
          <Button asChild size="lg" variant="outline">
            <Link href={`./FolderBrowser?rootFolder=${encodeURIComponent(rootFolder)}`}>
              <Folder className="mr-2 h-4 w-4" />
              {pathBasename(rootFolder)}
            </Link>
          </Button>
        )}

        {filePath && (
          <Button asChild size="lg" variant="outline">
            <Link href={`./Table?filePath=${encodeURIComponent(filePath)}`}>
              <Table className="mr-2 h-4 w-4" />
              {pathBasename(filePath)}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}