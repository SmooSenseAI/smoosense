'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/hooks'
import PrimaryKeyDropdown from '@/components/settings/PrimaryKeyDropdown'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { X, ListChecks } from 'lucide-react'
import { CLS } from '@/lib/utils/styles'
import HandPickedRowsTable from './HandPickedRowsTable'

export default function HandPickBar() {
  const [isOpen, setIsOpen] = useState(false)
  const pickedKeys = useAppSelector((state) => state.handPickedRows.pickedKeys)
  const count = pickedKeys.length

  // Warn users before leaving page if there are picked rows
  useEffect(() => {
    if (count === 0) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore custom messages, but this is required
      e.returnValue = 'You have hand-picked rows that will be lost. Are you sure you want to leave?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [count])

  return (
    <div className="flex items-center gap-4">
      <PrimaryKeyDropdown />
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className={count > 0 ? 'text-attention' : ''}
          >
            {count} picked
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-none p-0 flex flex-col"
          style={{ width: '90vw', height: '90vh' }}
          aria-describedby={undefined}
        >
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <ListChecks className="h-5 w-5" />
                </span>
                <span>Review hand-picked rows</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={CLS.ICON_BUTTON_SM}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <Card className="flex-1 mx-6 mb-6 mt-0 overflow-auto flex flex-col">
            <CardContent className="flex-1 p-0 overflow-auto">
              {isOpen && <HandPickedRowsTable />}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
