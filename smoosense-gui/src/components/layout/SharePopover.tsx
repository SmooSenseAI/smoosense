'use client'

import { Share2 } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import { useAppSelector } from '@/lib/hooks'

function SharePopoverContent() {
  const state = useAppSelector((state) => state)
  
  // Log the entire Redux state when this component renders
  console.log('Redux state:', state)
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Share</h3>
      <p className="text-sm text-muted-foreground">
        Share functionality will be implemented here.
      </p>
    </div>
  )
}

export default function SharePopover() {
  return (
    <IconPopover
      icon={<Share2 />}
      tooltip="Share"
      contentClassName="w-64 p-4"
      align="end"
    >
      <SharePopoverContent />
    </IconPopover>
  )
}