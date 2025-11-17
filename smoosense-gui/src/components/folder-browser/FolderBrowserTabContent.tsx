'use client'

import { ResizablePanels } from '@/components/ui/resizable-panels'
import { NAVBAR_HEIGHT } from '@/constants'
import FolderNavigation from './FolderNavigation'
import FSItemPreview from './FSItemPreview'

export default function FolderBrowserTabContent() {
  return (
    <div className="h-full w-full" style={{ maxHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
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