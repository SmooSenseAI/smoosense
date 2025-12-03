'use client'

import { memo } from 'react'
import { ChevronsLeftRightEllipsis } from 'lucide-react'

interface EmbeddingCellRendererProps {
  value: unknown
  embDim?: number | null
}

const EmbeddingCellRenderer = memo(function EmbeddingCellRenderer({
  value,
  embDim
}: EmbeddingCellRendererProps) {
  // Get dimension from prop or try to infer from array length
  const dimension = embDim ?? (Array.isArray(value) ? value.length : null)

  return (
    <div className="w-full h-full flex items-center gap-1.5 px-2 text-muted-foreground">
      <ChevronsLeftRightEllipsis className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm">
        {dimension !== null ? `${dimension} embedding` : 'embedding'}
      </span>
    </div>
  )
})

export default EmbeddingCellRenderer
