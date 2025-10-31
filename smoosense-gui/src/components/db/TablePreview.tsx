'use client'

import LanceVersions from './LanceVersions'

export default function TablePreview({
  rootFolder,
  tableName
}: {
  rootFolder: string
  tableName: string | null
}) {
  if (!tableName) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a table to view details</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Lance Indices Section */}
      <div className="flex-1 border-b">
        <div className="sticky top-0 bg-background border-b px-4 py-2">
          <h2 className="text-lg font-semibold">Lance Indices</h2>
        </div>
        <div className="h-[calc(100%-42px)] flex items-center justify-center text-muted-foreground">
          <p>Indices information will be displayed here</p>
        </div>
      </div>

      {/* Lance Versions Section */}
      <div className="flex-1">
        <div className="sticky top-0 bg-background border-b px-4 py-2">
          <h2 className="text-lg font-semibold">Lance Versions</h2>
        </div>
        <div className="h-[calc(100%-42px)]">
          <LanceVersions rootFolder={rootFolder} tableName={tableName} />
        </div>
      </div>
    </div>
  )
}
