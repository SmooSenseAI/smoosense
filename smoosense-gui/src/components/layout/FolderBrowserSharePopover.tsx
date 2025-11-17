'use client'

import { Share2 } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import AutoLink from '@/components/common/AutoLink'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { useAppSelector } from '@/lib/hooks'
import { pathRelative } from '@/lib/utils/pathUtils'

function FolderBrowserSharePopoverContent() {
  const rootFolder = useAppSelector((state) => state.ui.rootFolder)
  const viewingId = useAppSelector((state) => state.folderTree.viewingId)

  // Construct the URL
  const constructShareUrl = () => {
    const baseUrl = window.location.origin
    const params = new URLSearchParams()

    if (rootFolder) {
      params.set('rootFolder', rootFolder)
    }

    // If viewingId is set and different from rootFolder, add viewing parameter
    if (viewingId && viewingId !== rootFolder && rootFolder) {
      // Get relative path from rootFolder to viewingId
      const relativePath = pathRelative(viewingId, rootFolder)

      // Only add viewing param if we have a valid relative path
      if (relativePath) {
        params.set('viewing', relativePath)
      }
      // If pathRelative returns empty (different roots), omit the viewing param
    }

    const queryString = params.toString()
    return `${baseUrl}/FolderBrowser${queryString ? `?${queryString}` : ''}`
  }

  const shareUrl = constructShareUrl()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Share Folder Browser</h3>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Share this link to open the same folder and view:
        </p>
        <div className="flex items-center gap-2">
          <CopyToClipboard value={shareUrl} />
          <AutoLink url={shareUrl} className="flex-1" />
        </div>
      </div>
    </div>
  )
}

export default function FolderBrowserSharePopover() {
  return (
    <IconPopover
      icon={<Share2 />}
      tooltip="Share"
      contentClassName="w-96 p-4"
      align="end"
    >
      <FolderBrowserSharePopoverContent />
    </IconPopover>
  )
}
