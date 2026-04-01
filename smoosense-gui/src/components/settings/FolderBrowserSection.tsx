'use client'

function getLocalFolderPattern(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { LOCAL_FOLDER_PATTERN?: string | null }
  return w.LOCAL_FOLDER_PATTERN ?? null
}

export default function FolderBrowserSection() {
  const pattern = getLocalFolderPattern()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Folder Browser Settings</h3>

      <div className="text-sm">
        <span className="text-muted-foreground">Local folder access: </span>
        {pattern !== null ? (
          <span className="font-mono">enabled (prefix: {pattern})</span>
        ) : (
          <span className="text-muted-foreground">disabled</span>
        )}
      </div>
    </div>
  )
}
