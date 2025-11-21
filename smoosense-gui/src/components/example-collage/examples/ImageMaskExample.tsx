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
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_simplified_dev_1918.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_simplified_dev_1918.png",
    "word_scores": "[[\"In\", 0], [\"anime\", 0.4189], [\"style,\", 0], [\"a\", 0.3106], [\"flower\", 0.5764], [\"shop\", 1.2787], [\"designs\", 0.3106], [\"a\", 0], [\"Valentine's\", 0], [\"Day\", 0], [\"gift\", 0], [\"with\", 0], [\"vibrant\", 0], [\"roses,\", 0.8244], [\"elegantly\", 0], [\"arranged\", 1.0092], [\"and\", 0], [\"packaged\", 3.3968], [\"for\", 0.3219], [\"transport.\", 1.2304]]",
    "alignment_score": 3.16129994392395
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_simplified_dev_3416.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_simplified_dev_3416.png",
    "word_scores": "[[\"Fantasy\", 1.7372], [\"art\", 2.2813], [\"of\", 0.2797], [\"a\", 0.2797], [\"pink\", 0.6759], [\"and\", 0.2797], [\"black\", 2.1677], [\"frog\", 1.3596000000000001], [\"with\", 0.8762000000000001], [\"glowing\", 2.476], [\"pink\", 1.0125], [\"eyes\", 1.0125], [\"and\", 0.5965], [\"a\", 0.5965], [\"skull\", 0.5965], [\"on\", 0.5965], [\"its\", 0.5965], [\"back.\", 0.5965], [\"The\", 0.9977], [\"frog\", 1.451], [\"breathes\", 3.8204000000000002], [\"smoke\", 1.3869], [\"and\", 0.5965], [\"has\", 0.5965], [\"a\", 0.5965], [\"fiery\", 0.5965], [\"aura,\", 1.0859], [\"set\", 0.5965], [\"against\", 0.5965], [\"a\", 0.5965], [\"glowing\", 1.0859], [\"backdrop.\", 1.5689]]",
    "alignment_score": 2.8436999320983887
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_simplified_dev_3762.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_simplified_dev_3762.png",
    "word_scores": "[[\"half\", 1.6944], [\"moon\", 0.798], [\"in\", 0], [\"day\", 0.8174], [\"sky,\", 0.4012], [\"vector\", 0.359], [\"style,\", 0], [\"clean\", 0.8705], [\"lines,\", 0.3405], [\"flat\", 0], [\"colors,\", 1.3631], [\"minimal\", 2.6411000000000002], [\"shadows,\", 0.4343], [\"crisp\", 0.3662], [\"shapes,\", 0], [\"vibrant\", 0.917], [\"hues\", 0]]",
    "alignment_score": 2.5541000366210938
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_sd_2904.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_sd_2904.png",
    "word_scores": "[[\"A\", 0], [\"large\", 2.3828], [\"commercial\", 1.3528], [\"building\", 1.1601], [\"with\", 0], [\"a\", 0.4894], [\"grainy,\", 0.4645], [\"cinematic\", 0], [\"parking\", 0.4894], [\"lot\", 0.859], [\"in\", 0], [\"the\", 0], [\"foreground,\", 1.8746999999999998], [\"surrounded\", 0], [\"by\", 0], [\"dense\", 0.3696], [\"trees\", 0.3598], [\"and\", 0], [\"lush\", 0], [\"greenery,\", 0.9813999999999999], [\"under\", 0.8634], [\"a\", 0], [\"moody,\", 0.6679999999999999], [\"atmospheric\", 0], [\"sky\", 0.8634], [\"with\", 0], [\"dramatic\", 0.3696], [\"chiaroscuro\", 0.6208], [\"lighting.\", 0.467]]",
    "alignment_score": 2.830899953842163
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
