'use client'

import { ReactNode, useState } from 'react'
import { X, Maximize2, Minimize2, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isNil } from 'lodash'

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
  /** URL to display with copy and open functionality */
  url?: string | null
  /** Whether the popover is expanded */
  isExpanded: boolean
  /** Handler for expand/collapse toggle */
  onToggleExpand: () => void
  /** Handler for close */
  onClose: () => void
}

/**
 * Header component for CellPopover that shows URL with copy/open functionality
 * and expand/close controls
 */
export default function CellPopoverContentHeader({
  url,
  isExpanded,
  onToggleExpand,
  onClose
}: CellPopoverContentHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!url) return

    try {
      const textToCopy = isNil(url) ? 'null' : String(url)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers or clipboard API errors
    }
  }

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="flex items-center justify-between border-b p-2 gap-2 bg-muted/50">
      <div className="flex-1 min-w-0">
        {url && (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
              {url}
            </code>
            <HeaderButton
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </HeaderButton>
            <HeaderButton
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </HeaderButton>
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