'use client'

import { Button } from '@/components/ui/button'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setRowHeight } from '@/lib/features/ui/uiSlice'

export default function RowHeightButtons() {
  const dispatch = useAppDispatch()
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Height</label>
      <div className="flex gap-2">
        {[50, 100, 150, 200].map((height) => (
          <Button
            key={height}
            variant={rowHeight === height ? "default" : "outline"}
            size="sm"
            onClick={() => dispatch(setRowHeight(height))}
            className="text-xs px-2 py-1 h-7"
          >
            {height}px
          </Button>
        ))}
      </div>
    </div>
  )
}