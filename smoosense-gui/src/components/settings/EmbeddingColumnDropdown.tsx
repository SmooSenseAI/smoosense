'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import ColumnDropdown from '@/components/common/ColumnDropdown'

export default function EmbeddingColumnDropdown() {
  return (
    <ColumnDropdown
      settingKey="embColumn"
      label="Embedding Column"
      candidateRenderTypes={[RenderType.Embedding]}
    />
  )
}
