'use client'

import { ResizablePanels } from '@/components/ui/resizable-panels'
import FolderNavigation from './FolderNavigation'
import FSItemPreview from './FSItemPreview'

export default function FolderBrowserTabContent() {
  return (
    <div className="h-full w-full">
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[20, 80]}
        minSize={15}
        maxSize={85}
        className="h-full"
      >
        <FolderNavigation />
        <FSItemPreview />
      </ResizablePanels>
    </div>
  )
}