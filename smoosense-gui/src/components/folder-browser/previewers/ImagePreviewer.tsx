'use client'

import { useState } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import PreviewError from './shared/PreviewError'

interface ImagePreviewerProps {
  item: TreeNode
}

export default function ImagePreviewer({ item }: ImagePreviewerProps) {
  const [hasError, setHasError] = useState(false)
  const imageUrl = getFileUrl(item.path, true)
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        {hasError ? (
          <PreviewError 
            title="Failed to load image"
            message="The image could not be loaded or displayed."
          />
        ) : (
          <img
            src={imageUrl}
            alt={item.name}
            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  )
}