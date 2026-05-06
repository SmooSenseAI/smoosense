'use client'

import { memo } from 'react'
import { FileText } from 'lucide-react'
import CellPopover from '@/components/ui/CellPopover'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { pathBasename } from "@/lib/utils/pathUtils"
import { useAppSelector } from '@/lib/hooks'

interface PdfCellContentProps {
  /** URL that goes into the iframe — may be a regular URL or a data: URL. */
  pdfUrl: string
  /** User-friendly identifier shown in header and copied on click (e.g. original path or filename). */
  copyValue: string
  /** URL used for external open; defaults to copyValue when omitted. */
  openUrl?: string
}

/**
 * Shared PDF cell content that renders a FileText-icon cell and an iframe popover.
 * Accepts both regular URLs and data: URLs (for inline BLOB bytes).
 */
export const PdfCellContent = memo(function PdfCellContent({
  pdfUrl,
  copyValue,
  openUrl,
}: PdfCellContentProps) {
  const filename = pathBasename(copyValue)

  const cellContent = (
    <div className="flex items-center gap-2 px-2 py-1">
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm truncate">{filename}</span>
    </div>
  )

  const popoverContent = (
    <iframe
      src={pdfUrl}
      className="w-full h-full border-0"
      title="PDF Preview"
    />
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={openUrl ?? copyValue}
      copyValue={copyValue}
      popoverClassName="w-[600px] h-[500px]"
    />
  )
})

interface PdfCellRendererProps {
  value: unknown
}

const PdfCellRenderer = memo(function PdfCellRenderer({ value }: PdfCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()
  const resolvedUrl = mayResolveUrl({ value, tablePath, baseUrl })

  return <PdfCellContent pdfUrl={resolvedUrl} copyValue={originalUrl} openUrl={resolvedUrl} />
})

export default PdfCellRenderer
