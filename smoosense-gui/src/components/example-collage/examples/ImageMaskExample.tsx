'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'

// Hard-coded data from cleaned.parquet
const EXAMPLE_DATA = [
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_sd_1.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_sd_1.png",
    "word_scores": "[[\"a\", 0], [\"harp\", 0.477], [\"without\", 3.1413], [\"strings,\", 0.97], [\"in\", 0.4793], [\"an\", 0.4793], [\"anime\", 0], [\"style,\", 0], [\"with\", 0], [\"intricate\", 1.5925], [\"details\", 0], [\"and\", 0], [\"flowing\", 0], [\"lines,\", 0], [\"set\", 0], [\"against\", 0], [\"a\", 0], [\"dreamy,\", 0.6508], [\"pastel\", 0], [\"background,\", 0.3946], [\"bathed\", 0], [\"in\", 0], [\"soft\", 0], [\"golden\", 0.6118], [\"hour\", 0], [\"light,\", 0.4012], [\"with\", 0], [\"a\", 0], [\"serene\", 0], [\"mood\", 0], [\"and\", 0], [\"rich\", 0], [\"textures,\", 0], [\"high\", 0], [\"resolution,\", 2.2098], [\"photorealistic\", 0]]",
    "alignment_score": 3.0243000984191895
  }
]

export function ImageMaskVisual() {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    image_url: {
      headerName: 'Image',
      width: 120,
      pinned: 'left'
    },
    image_mask_alignment: {
      headerName: 'Mask',
      width: 120,
      pinned: 'left'
    },
    word_scores: {
      headerName: 'Word Scores',
      width: 150,
      flex: 1
    },
    alignment_score: {
      headerName: 'Score',
      width: 80,
    }
  }), [])

  return (
    <div className="w-full h-full">
      <BasicAGTable
        data={EXAMPLE_DATA}
        colDefOverrides={colDefOverrides}
        gridOptionOverrides={{
          rowHeight: 120
        }}
      />
    </div>
  )
}

export function ImageMaskDescription() {
  return (
    <div className="text-sm">
      <p>Visualize image misalignment mask with word-level misalignment scores for text-to-image evaluation.</p>
    </div>
  )
}
