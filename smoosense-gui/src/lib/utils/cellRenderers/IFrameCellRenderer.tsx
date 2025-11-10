'use client'

import { memo } from 'react'
import CellPopover from '@/components/ui/CellPopover'
import { isNil } from 'lodash'

interface IFrameCellRendererProps {
  value: unknown
}

const IFrameCellRenderer = memo(function IFrameCellRenderer({
  value
}: IFrameCellRendererProps) {
  let iframeUrl = String(value).trim()

  // Strip iframe+ prefix if present
  if (iframeUrl.startsWith('iframe+http://') || iframeUrl.startsWith('iframe+https://')) {
    iframeUrl = iframeUrl.replace(/^iframe\+/, '')
  }

  // Handle empty or invalid values
  if (isNil(value) || value === '' || !iframeUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No iframe
      </div>
    )
  }

  const cellContent = (
    <div
      className="w-full h-full border rounded overflow-hidden cursor-pointer hover:shadow-sm transition-shadow relative"
      style={{ backgroundColor: 'transparent' }}
    >
      <iframe
        src={iframeUrl}
        className="w-full h-full border-none pointer-events-none"
        title="Preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        style={{ backgroundColor: 'transparent' }}
        onError={(e) => {
          // Fallback to text if iframe fails to load
          const target = e.target as HTMLIFrameElement
          target.style.display = 'none'
          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-muted rounded">Invalid iframe</div>`
        }}
      />
      {/* Invisible overlay to capture clicks */}
      <div className="absolute inset-0 w-full h-full cursor-pointer" />
    </div>
  )

  const popoverContent = (
    <div className="border h-full flex-1 rounded overflow-hidden" style={{ backgroundColor: 'transparent' }}>
      <iframe
        src={iframeUrl}
        className="w-full h-full border-none"
        title="Full size iframe"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        style={{ backgroundColor: 'transparent' }}
        onError={(e) => {
          const target = e.target as HTMLIFrameElement
          target.style.display = 'none'
          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground bg-muted rounded">Failed to load iframe</div>`
        }}
      />
    </div>
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={iframeUrl}
      copyValue={iframeUrl}
    />
  )
})

export default IFrameCellRenderer