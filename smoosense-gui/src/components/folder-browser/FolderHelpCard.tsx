'use client'

import React from 'react'
import { HelpCircle, MousePointerClick, MousePointer2, LucideIcon } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'

interface HelpItem {
  icon: LucideIcon
  title: string
  description: string
}

const HELP_ITEMS: HelpItem[] = [
  {
    icon: MousePointerClick,
    title: 'Click arrow icon',
    description: 'Expand/collapse folder node'
  },
  {
    icon: MousePointerClick,
    title: 'Click file/folder name',
    description: 'Preview content in the right panel'
  },
  {
    icon: MousePointer2,
    title: 'Double-click folder name',
    description: 'Expand/collapse folder node'
  },
  {
    icon: MousePointer2,
    title: 'Double-click table file',
    description: 'Open file in new tab (for CSV, Parquet, etc.)'
  }
]

export default function FolderHelpCard() {
  return (
    <IconPopover
      icon={<HelpCircle />}
      tooltip="Help"
      contentClassName="w-96 p-4"
      side="right"
      align="start"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Tree View Operations</h3>

        <div className="space-y-3 text-sm">
          {HELP_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </IconPopover>
  )
}
