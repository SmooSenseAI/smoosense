'use client'

import { useState } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import PreviewError from './shared/PreviewError'

interface VideoPreviewerProps {
  item: TreeNode
}

export default function VideoPreviewer({ item }: VideoPreviewerProps) {
  const [hasError, setHasError] = useState(false)
  const videoUrl = getFileUrl(item.path, true)
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <h4 className="text-lg font-medium mb-1">
          {item.name}
        </h4>
        <p className="text-sm text-muted-foreground">
          Video Preview
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {hasError ? (
          <PreviewError 
            title="Failed to load video"
            message="The video could not be loaded or played."
          />
        ) : (
          <video 
            src={videoUrl} 
            controls
            className="max-w-full max-h-full rounded-lg shadow-sm"
            preload="metadata"
            onError={() => setHasError(true)}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  )
}