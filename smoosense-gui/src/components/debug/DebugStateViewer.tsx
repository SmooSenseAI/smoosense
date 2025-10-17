'use client'

import { useAppSelector } from '@/lib/hooks'
import { Bug } from 'lucide-react'
import JsonBox from '@/components/ui/JsonBox'
import IconDialog from '@/components/common/IconDialog'

function DebugStateContent() {
  const reduxState = useAppSelector((state) => state)

  return (
    <div className="flex-1 p-0 overflow-hidden">
      <JsonBox
        src={reduxState}
        className="h-full"
      />
    </div>
  )
}

export default function DebugStateViewer() {
  return (
    <IconDialog
      icon={<Bug />}
      title="Redux State Viewer"
      tooltip="Debug Redux State"
      width="50vw"
      height="90vh"
    >
      <DebugStateContent />
    </IconDialog>
  )
}