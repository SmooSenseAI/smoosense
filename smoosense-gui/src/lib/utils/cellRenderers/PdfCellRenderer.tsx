'use client'

import { memo } from 'react'
import { FileText } from 'lucide-react'
import CellPopover from '@/components/ui/CellPopover'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { pathBasename } from "@/lib/utils/pathUtils"
import { useAppSelector } from '@/lib/hooks'

interface PdfCellRendererProps {
  value: unknown
}

const PdfCellRenderer = memo(function PdfCellRenderer({ value }: PdfCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const originalUrl = String(value).trim()

  const resolvedUrl = mayResolveUrl({ value, tablePath, baseUrl })

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
      src={resolvedUrl}
      className="w-full h-full border-0"
      title="PDF Preview"
    />
  )

  return (
    <CellPopover
      cellContent={cellContent}
      popoverContent={popoverContent}
      url={resolvedUrl}
      copyValue={originalUrl}
      popoverClassName="w-[600px] h-[500px]"
    />
  )
})

export default PdfCellRenderer
