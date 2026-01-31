'use client'

import { useAppSelector, useAppDispatch, useRowData } from '@/lib/hooks'
import { handPickRows, PrimaryKeyValue } from '@/lib/features/handPickedRows/handPickedRowsSlice'
import { Button } from '@/components/ui/button'
import { ListPlus } from 'lucide-react'

export default function PickAllButton() {
  const dispatch = useAppDispatch()
  const primaryKeyColumn = useAppSelector((state) => state.ui.primaryKeyColumn)
  const { data } = useRowData()

  const handlePickAll = () => {
    if (!primaryKeyColumn || !data || data.length === 0) return

    const pkValues = data
      .map((row) => row[primaryKeyColumn] as PrimaryKeyValue)
      .filter((value) => value !== undefined)

    dispatch(handPickRows(pkValues))
  }

  // Only show if primary key is set
  if (!primaryKeyColumn) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePickAll}
      className="h-7 text-xs cursor-pointer"
      title="Pick all rows on current page"
    >
      <ListPlus className="h-3 w-3 mr-1" />
      Pick all
    </Button>
  )
}
