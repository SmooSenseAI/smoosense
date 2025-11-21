'use client'

import JsonBox from '@/components/ui/JsonBox'

// Example data from ImageMaskExample
const EXAMPLE_DATA = [
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_sd_1.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_sd_1.png",
    "word_scores": [["a", 0], ["harp", 0.477], ["without", 3.1413], ["strings,", 0.97], ["in", 0.4793], ["an", 0.4793], ["anime", 0], ["style,", 0], ["with", 0], ["intricate", 1.5925], ["details", 0]],
    "alignment_score": 3.0243000984191895
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_simplified_dev_1918.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_simplified_dev_1918.png",
    "word_scores": [["In", 0], ["anime", 0.4189], ["style,", 0], ["a", 0.3106], ["flower", 0.5764], ["shop", 1.2787], ["designs", 0.3106], ["a", 0], ["Valentine's", 0], ["Day", 0], ["gift", 0]],
    "alignment_score": 3.16129994392395
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_simplified_dev_3416.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_simplified_dev_3416.png",
    "word_scores": [["Fantasy", 1.7372], ["art", 2.2813], ["of", 0.2797], ["a", 0.2797], ["pink", 0.6759], ["and", 0.2797], ["black", 2.1677], ["frog", 1.3596]],
    "alignment_score": 2.8436999320983887
  }
]

export function JsonTreeVisual() {
  return (
    <div className="w-full h-full">
      <JsonBox src={EXAMPLE_DATA} showControls={true} />
    </div>
  )
}

export function JsonTreeDescription() {
  return (
    <div className="text-sm">
      <p>Interactive JSON tree viewer with collapsible nodes and search functionality.</p>
    </div>
  )
}
