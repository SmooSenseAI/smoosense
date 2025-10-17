'use client'

import { ReactNode, cloneElement, isValidElement, ReactElement, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CLS } from '@/lib/utils/styles'

interface IconPopoverProps {
  icon: ReactNode
  title?: string
  tooltip?: string
  children: ReactNode
  buttonClassName?: string
  contentClassName?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
}

export default function IconPopover({
  icon,
  title,
  tooltip,
  children,
  buttonClassName = '',
  contentClassName = 'w-80 p-4',
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0
}: IconPopoverProps) {
  const [open, setOpen] = useState(false)

  // Clone the icon element and add size classes
  const iconWithSize = isValidElement(icon) 
    ? cloneElement(icon as ReactElement<{ className?: string }>, { 
        className: `h-4 w-4 ${(icon.props as { className?: string })?.className || ''}`.trim()
      })
    : icon

  const ringClasses = open ? 'ring-2 ring-ring' : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={tooltip || title}
          className={`${CLS.ICON_BUTTON_SM} h-8 px-2 ${ringClasses} ${buttonClassName}`.trim()}
        >
          {iconWithSize}
          {title && (
            <span className="text-xs ml-1">{title}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={contentClassName}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}