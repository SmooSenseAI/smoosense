'use client'

import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AIQuickAction } from '@/lib/features/aiQuickActions/aiQuickActionsSlice'

interface QuickActionsProps {
  quickActions: AIQuickAction[]
  onActionClick: (action: AIQuickAction) => void
}

export default function QuickActions({ quickActions, onActionClick }: QuickActionsProps) {
  return (
    <ul className="space-y-3 mt-3">
      {quickActions.map((action, index) => (
        <li key={index} className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 h-7 w-7 p-0"
            onClick={() => onActionClick(action)}
          >
            <Play className="h-3 w-3" />
          </Button>
          <span className="text-sm flex-1 leading-relaxed">
            {action.name}
          </span>
        </li>
      ))}
    </ul>
  )
}