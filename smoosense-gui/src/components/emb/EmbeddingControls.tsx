'use client'

import { RenderType } from '@/lib/utils/agGridCellRenderers'
import ColumnDropdown from '@/components/common/ColumnDropdown'

export default function EmbeddingControls() {
  return (
    <div className="flex-shrink-0 p-4 border-b bg-background">
      <div className="flex gap-4 items-center">
        <ColumnDropdown
          settingKey="embColumn"
          label="Embedding Column"
          candidateRenderTypes={[RenderType.Embedding]}
        />
      </div>
    </div>
  )
}
