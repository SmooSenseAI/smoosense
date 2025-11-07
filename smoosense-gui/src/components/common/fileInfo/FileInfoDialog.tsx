'use client'

import { Info, Loader2, AlertCircle, Download } from 'lucide-react'
import IconDialog from '@/components/common/IconDialog'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import { useFileInfo } from '@/lib/hooks/useFileInfo'
import { useAppSelector } from '@/lib/hooks'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { pathBasename } from '@/lib/utils/pathUtils'
import { CLS } from '@/lib/utils/styles'
import { getFileUrl } from '@/lib/utils/apiUtils'
import FormatSpecialInfo from './FormatSpecialInfo'

export default function FileInfoDialog() {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const { data, loading, error } = useFileInfo()

  // Don't show the dialog trigger if no file is selected
  if (!tablePath) {
    return null
  }

  const handleDownload = () => {
    if (tablePath) {
      const url = getFileUrl(tablePath, true)
      window.open(url, '_blank')
    }
  }

  const renderFileInfo = () => {
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
      <div className="space-y-4 p-6 h-full overflow-auto">
        {/* File and Dataset Information */}
        <div>
          {metadata?.description && (
            <h3 className="font-medium text-sm mb-5">{metadata.description}</h3>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex-shrink-0">Name:</span>
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="truncate">{pathBasename(tablePath)}</span>
                <button
                  onClick={handleDownload}
                  className={CLS.ICON_BUTTON_SM_SUBTLE}
                  title="Download file"
                >
                  <Download className="h-3 w-3" />
                </button>
                <CopyToClipboard value={pathBasename(tablePath)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex-shrink-0">Path:</span>
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="truncate">{tablePath}</span>
                <CopyToClipboard value={tablePath} />
              </div>
            </div>
            {metadata?.source && (
              <div className="flex justify-start">
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
            <div className="space-y-1 text-sm">
              {additionalMetadata.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{key}:</span>
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="truncate">{value}</span>
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
    <IconDialog
      icon={<Info />}
      tooltip="File Information"
      title="File Information"
      width="90vw"
      height="90vh"
    >
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[30, 70]}
        minSize={20}
        maxSize={80}
      >
        {/* Left Panel - File Info */}
        <div className="h-full border-r">
          {renderFileInfo()}
        </div>

        {/* Right Panel - Content based on file type */}
        <FormatSpecialInfo tablePath={tablePath} />
      </ResizablePanels>
    </IconDialog>
  )
}
