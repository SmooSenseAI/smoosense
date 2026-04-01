'use client'

import { getLocalFolderPattern } from '@/lib/utils/pathUtils'

export default function FolderBrowserSection() {
  const pattern = getLocalFolderPattern()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Folder Browser Settings</h3>

      <div className="text-sm">
        <span className="text-muted-foreground">Local folder access: </span>
        {pattern === '' ? (
          <span className="text-muted-foreground">disabled</span>
        ) : pattern === null || pattern === '*' ? (
          <span>enabled (all paths)</span>
        ) : (
          <span className="font-mono">enabled (prefix: {pattern})</span>
        )}
      </div>
    </div>
  )
}
