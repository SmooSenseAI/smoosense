'use client'

import { useState, ReactNode, cloneElement, isValidElement, ReactElement } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { CLS } from '@/lib/utils/styles'

interface IconDialogProps {
  icon: ReactNode
  title: string
  tooltip?: string
  children: ReactNode
  width?: string
  height?: string
  buttonClassName?: string
  onOpen?: () => void
}

export default function IconDialog({
  icon,
  title,
  tooltip,
  children,
  width = '90vw',
  height = '90vh',
  buttonClassName = '',
  onOpen
}: IconDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Clone the icon element and add size classes for button
    const iconWithSize = isValidElement(icon)
        ? cloneElement(icon as ReactElement<{ className?: string }>, {
            className: `h-4 w-4 ${(icon.props as { className?: string })?.className || ''}`.trim()
          })
        : icon

    // Clone the icon element with larger size for header
    const headerIcon = isValidElement(icon)
        ? cloneElement(icon as ReactElement<{ className?: string }>, {
            className: `h-5 w-5 ${(icon.props as { className?: string })?.className || ''}`.trim()
          })
        : icon

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogTrigger asChild>
                <button
                    title={tooltip || title}
                    onClick={() => {
                        setIsOpen(true)
                        onOpen?.()
                    }}
                    className={`${CLS.ICON_BUTTON_SM} h-8 px-2 ${buttonClassName}`}
                >
                    {iconWithSize}
                </button>
            </DialogTrigger>
            <DialogContent
                className="max-w-none p-0 flex flex-col"
                style={{ width, height }}
                aria-describedby={undefined}
            >
                <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                {headerIcon}
                            </span>
                            <span>{title}</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`${CLS.ICON_BUTTON_SM} `}
                            aria-label="Close dialog"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </DialogTitle>
                </DialogHeader>
                <Card className="flex-1 mx-6 mb-6 mt-0 overflow-auto flex flex-col">
                    <CardContent className="flex-1 p-0 overflow-auto">
                        {isOpen && children}
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
}