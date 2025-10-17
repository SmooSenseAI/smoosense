'use client'

import { useState } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import PreviewError from './shared/PreviewError'

interface PdfPreviewerProps {
  item: TreeNode
}

export default function PdfPreviewer({ item }: PdfPreviewerProps) {
  const [hasError, setHasError] = useState(false)
  const pdfUrl = getFileUrl(item.path, true)

  if (hasError) {
    return (
      <PreviewError
        title="Failed to load PDF"
        message="The PDF file could not be loaded or displayed."
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <iframe
          src={pdfUrl}
          className="w-full h-full rounded-lg border"
          title={item.name}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  )
}
