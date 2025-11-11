'use client'

import { ResizablePanels } from '@/components/ui/resizable-panels'
import FolderNavigation from './FolderNavigation'
import FSItemPreview from './FSItemPreview'

export default function FolderBrowserTabContent() {
  return (
    <div className="h-full w-full">
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[30, 70]}
        minSize={20}
        maxSize={80}
        className="h-full"
      >
        <FolderNavigation />
        <FSItemPreview />
      </ResizablePanels>
    </div>
  )
}