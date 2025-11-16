'use client'

import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getFileUrl } from '@/lib/utils/apiUtils'
import RichAudioPlayer from '@/components/audio/RichAudioPlayer'

interface AudioPreviewerProps {
  item: TreeNode
}

export default function AudioPreviewer({ item }: AudioPreviewerProps) {
  const audioUrl = getFileUrl(item.path, true)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="w-full max-w-4xl">
          <RichAudioPlayer audioUrl={audioUrl} autoPlay={true} />
        </div>
      </div>
    </div>
  )
}
