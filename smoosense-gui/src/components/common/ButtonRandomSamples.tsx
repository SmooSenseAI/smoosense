'use client'

import { useAppDispatch } from '@/lib/hooks'
import { clickForRandomSamples } from '@/lib/features/rowData/rowDataSlice'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

export default function ButtonRandomSamples() {
  const dispatch = useAppDispatch()

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={() => dispatch(clickForRandomSamples())}
    >
      <RefreshCcw className="h-4 w-4" />
      Random
    </Button>
  )
}