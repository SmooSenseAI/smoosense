'use client'

import { Info, Loader2, AlertCircle, Download } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import { useFileInfo } from '@/lib/hooks/useFileInfo'
import { useAppSelector } from '@/lib/hooks'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { pathBasename } from '@/lib/utils/pathUtils'
import { CLS } from '@/lib/utils/styles'
import { getFileUrl } from '@/lib/utils/apiUtils'

export default function FileInfoPopover() {
  const filePath = useAppSelector((state) => state.ui.filePath)
  const { data, loading, error } = useFileInfo()

  // Don't show the popover if no file is selected
  if (!filePath) {
    return null
  }

  const handleDownload = () => {
    if (filePath) {
      const url = getFileUrl(filePath, true)
      window.open(url, '_blank')
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading file info...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 p-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Failed to load file info</span>
        </div>
      )
    }

    if (!data) {
      return (
        <div className="p-4">
          <span className="text-sm text-muted-foreground">No file info available</span>
        </div>
      )
    }

    const { metadata } = data

    // Filter out the standard metadata fields to get additional properties
    const standardFields = new Set(['description', 'source', 'source_url'])
    const additionalMetadata = metadata ? Object.entries(metadata).filter(([key]) => !standardFields.has(key)) : []

    return (
      <div className="space-y-4 max-w-xs">
        {/* File and Dataset Information */}
        <div>
          {metadata?.description && (
            <h3 className="font-medium text-sm mb-2">{metadata.description}</h3>
          )}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name:</span>
              <div className="flex items-center gap-1">
                <span className="truncate max-w-[150px]">{pathBasename(filePath)}</span>
                <button
                  onClick={handleDownload}
                  className={CLS.ICON_BUTTON_SM_SUBTLE}
                  title="Download file"
                >
                  <Download className="h-3 w-3" />
                </button>
                <CopyToClipboard value={pathBasename(filePath)} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Path:</span>
              <div className="flex items-center gap-1">
                <span className="truncate max-w-[150px]">{filePath}</span>
                <CopyToClipboard value={filePath} />
              </div>
            </div>
            {metadata?.source && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                {metadata?.source_url ? (
                  <a
                    href={metadata.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-2 ${CLS.HYPERLINK}`}
                  >
                    {metadata.source}
                  </a>
                ) : (
                  <span className="ml-2">{metadata.source}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Metadata */}
        {additionalMetadata.length > 0 && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm mb-2">Additional Metadata</h3>
            <div className="space-y-1 text-xs">
              {additionalMetadata.map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{key}:</span>
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[150px]">{value}</span>
                    <CopyToClipboard value={value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    )
  }

  return (
    <IconPopover
      icon={<Info className="h-4 w-4" />}
      tooltip="File Information"
      contentClassName="w-auto max-w-sm p-4"
      align="start"
    >
      {renderContent()}
    </IconPopover>
  )
}