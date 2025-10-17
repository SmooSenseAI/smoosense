'use client'

import { useState, ReactNode } from 'react'
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import CellPopoverContentHeader from '@/components/ui/CellPopoverContentHeader'

interface CellPopoverProps {
  /** The cell content that will be clickable to trigger the popover */
  cellContent: ReactNode
  /** The content to show inside the popover */
  popoverContent: ReactNode
  /** URL to show in header with copy and open functionality */
  url?: string | null
  /** Additional className for the popover content */
  popoverClassName?: string
  /** Additional className for the cell content container */
  cellContentClassName?: string
  /** Whether the popover is disabled */
  disabled?: boolean
  /** Callback when popover open state changes */
  onOpenChange?: (open: boolean) => void
  /** Override for popover side positioning */
  side?: "top" | "right" | "bottom" | "left"
  /** Override for popover alignment */
  align?: "start" | "center" | "end"
  /** Value to copy when copy button is clicked. If null, no copy button is shown */
  copyValue?: string | null
}

/**
 * A reusable cell popover component that handles:
 * - Opening popover on cell click
 * - Closing popover on second click
 * - Closing popover when clicking outside
 * - Visual feedback with ring styling when open
 * - Optional copy button on hover when copyValue is provided
 */
export default function CellPopover({
  cellContent,
  popoverContent,
  url,
  popoverClassName = "",
  cellContentClassName = "items-start",
  disabled = false,
  onOpenChange,
  side = "top",
  align = "start",
  copyValue = null
}: CellPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePopoverChange = (open: boolean) => {
    setIsPopoverOpen(open)
    if (!open) {
      setIsExpanded(false) // Reset expanded state when closing
    }
    onOpenChange?.(open)
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  const handleClose = () => {
    setIsPopoverOpen(false)
    setIsExpanded(false)
    onOpenChange?.(false)
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  if (disabled) {
    return <>{cellContent}</>
  }

  // Add ring styling when popover is open and copy button when hovered
  const enhancedCellContent = (
    <div
      className={`relative w-full h-full flex cursor-pointer ${isPopoverOpen ? 'ring-2 ring-primary rounded' : ''} ${cellContentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {cellContent}
      {isHovered && copyValue && (
        <div className="absolute top-0 right-0 z-10">
          <CopyToClipboard value={copyValue} />
        </div>
      )}
    </div>
  )

  // Common content for both popover and dialog
  const contentBody = (
    <div className='flex flex-col h-full min-h-0'>
      <CellPopoverContentHeader
        url={url}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        onClose={handleClose}
      />

      {/* Content Area */}
      <div className='flex-1 overflow-auto min-h-0'>
        {popoverContent}
      </div>
    </div>
  )

  // When expanded, use Dialog
  if (isExpanded) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={handlePopoverChange}>
        <DialogTrigger asChild>
          {enhancedCellContent}
        </DialogTrigger>
        <DialogContent
          className="w-[90vw] h-[90vh] p-2 max-w-none flex flex-col"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Cell Content</DialogTitle>
          {contentBody}
        </DialogContent>
      </Dialog>
    )
  }

  // When collapsed, use Popover
  const contentClassName = cn(
    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--radix-popover-content-transform-origin) rounded-md border shadow-md outline-hidden",
    "w-[500px] h-[400px] overflow-auto", // Give ancestors a real height
    popoverClassName,
  )

  return (
    <PopoverPrimitive.Root open={isPopoverOpen} onOpenChange={handlePopoverChange}>
      <PopoverPrimitive.Anchor asChild>
        <PopoverPrimitive.Trigger asChild>
          {enhancedCellContent}
        </PopoverPrimitive.Trigger>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={contentClassName}
          side={side}
          align={align}
          sideOffset={4}
        >
          {contentBody}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}