'use client'

import { memo } from 'react'
import { FileText } from 'lucide-react'
import CellPopover from '@/components/ui/CellPopover'
import { proxyedUrl } from '@/lib/utils/urlUtils'
import {pathBasename} from "@/lib/utils/pathUtils";

interface PdfCellRendererProps {
  value: unknown
}

const PdfCellRenderer = memo(function PdfCellRenderer({ value }: PdfCellRendererProps) {
  const originalUrl = String(value)
  const pdfUrl = proxyedUrl(originalUrl)

  // Extract filename from URL
  const filename = pathBasename(originalUrl)

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
      url={pdfUrl}
      copyValue={pdfUrl}
      popoverClassName="w-[600px] h-[500px]"
    />
  )
})

export default PdfCellRenderer
