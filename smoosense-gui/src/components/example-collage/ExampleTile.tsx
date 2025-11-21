'use client'

import { ReactNode } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ExampleTileProps {
  title: string
  description?: ReactNode
  visual?: ReactNode
  colSpan?: 1 | 2
  rowSpan?: 1 | 2
}

export default function ExampleTile({ title, description, visual, colSpan = 1, rowSpan = 1 }: ExampleTileProps) {
  const spanClasses = [
    colSpan === 2 ? 'md:col-span-2' : '',
    rowSpan === 2 ? 'row-span-2' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow ${spanClasses}`}>
      {/* Header with title and info icon */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm">{title}</h3>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Visual content area */}
      <div className={`flex items-center justify-center bg-muted/10 ${rowSpan === 2 ? 'h-[calc(100%-3rem)]' : 'aspect-video'}`}>
        {visual || (
          <div className="text-muted-foreground text-sm">
            Placeholder
          </div>
        )}
      </div>
    </div>
  )
}
