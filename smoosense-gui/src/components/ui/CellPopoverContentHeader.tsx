'use client'

import { ReactNode } from 'react'
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderButtonProps {
  onClick: () => void
  title: string
  children: ReactNode
  className?: string
}

/**
 * Standardized button component for header controls
 */
function HeaderButton({ onClick, title, children, className = "" }: HeaderButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`${className} h-8 w-8 p-0 hover:border-1`}
      title={title}
    >
      {children}
    </Button>
  )
}

interface CellPopoverContentHeaderProps {
  /** URL to display with open functionality */
  url?: string | null
  /** Title text to display */
  title?: string | null
  /** Whether the popover is expanded */
  isExpanded: boolean
  /** Handler for expand/collapse toggle */
  onToggleExpand: () => void
  /** Handler for close */
  onClose: () => void
}

/**
 * Header component for CellPopover that shows URL with open functionality
 * and expand/close controls
 */
export default function CellPopoverContentHeader({
  url,
  title,
  isExpanded,
  onToggleExpand,
  onClose
}: CellPopoverContentHeaderProps) {

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const displayText = title || url

  return (
    <div className="flex items-center justify-between border-b p-2 gap-2 bg-muted/50">
      <div className="flex-1 min-w-0">
        {displayText && (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm font-medium truncate">
              {displayText}
            </span>

            {url && (
              <HeaderButton
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </HeaderButton>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <HeaderButton
          onClick={onToggleExpand}
          title={isExpanded ? "Minimize" : "Maximize"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </HeaderButton>
        <HeaderButton
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
        </HeaderButton>
      </div>
    </div>
  )
}