'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import JsonBox from '@/components/ui/JsonBox'

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
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_dev_3354.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_dev_3354.png",
    "word_scores": "[[\"white\", 1.4574], [\"fluffy\", 1.0105], [\"goose\", 1.4513], [\"holding\", 5.048], [\"a\", 1.0105], [\"light\", 1.0105], [\"purple\", 1.5158999999999998], [\"balloon,\", 1.7004], [\"watercolor,\", 1.6861000000000002], [\"soft\", 1.1763], [\"wash,\", 1.9656000000000002], [\"white\", 0.4377], [\"background,\", 0.4377], [\"loose\", 1.1763], [\"brushstrokes,\", 1.1763], [\"delicate\", 1.7422999999999997], [\"hues,\", 1.1763], [\"ethereal\", 1.1763], [\"glow,\", 1.1763], [\"high\", 2.8501000000000003], [\"resolution,\", 1.1763], [\"serene\", 0.4377], [\"mood\", 1.1763]]",
    "alignment_score": 2.34660005569458
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_dev_3531.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_dev_3531.png",
    "word_scores": "[[\"create\", 0], [\"a\", 0], [\"vibrant\", 0.8427], [\"anime\", 1.15], [\"image\", 0], [\"for\", 0], [\"a\", 0], [\"luxury\", 0.7023], [\"pet\", 0], [\"day\", 0.8427], [\"care\", 0.5217], [\"brand,\", 0], [\"featuring\", 0.8427], [\"regal\", 0], [\"cats\", 2.5807], [\"and\", 0], [\"dogs\", 0.7178], [\"in\", 0], [\"a\", 0.8159], [\"grand,\", 0], [\"ornate\", 0], [\"palace\", 0.7647], [\"with\", 0], [\"intricate\", 0], [\"details,\", 0.6365], [\"bathed\", 0], [\"in\", 0.8427], [\"soft\", 0.4282], [\"golden\", 0.8427], [\"hour\", 0], [\"light,\", 0.6679], [\"with\", 0], [\"a\", 0.8427], [\"modern,\", 0], [\"colorful\", 0], [\"twist\", 0], [\"on\", 0], [\"royal\", 0], [\"pet\", 0], [\"care,\", 0], [\"using\", 0], [\"a\", 0], [\"high-resolution,\", 0], [\"photorealistic\", 0], [\"style\", 0], [\"and\", 0], [\"dynamic\", 0], [\"perspective\", 0]]",
    "alignment_score": 3.183500051498413
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_dev_414.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_dev_414.png",
    "word_scores": "[[\"A\", 0], [\"sleek\", 0], [\"neonpunk\", 1.0831], [\"sunset,\", 1.24], [\"a\", 0], [\"polished\", 0], [\"white\", 0.8931], [\"robot\", 0], [\"with\", 0], [\"a\", 0], [\"brown\", 2.6905], [\"head\", 1.2162], [\"crowned\", 0], [\"with\", 0], [\"glowing\", 0], [\"neon\", 0.8375], [\"flowers\", 0.4533], [\"faces\", 0], [\"a\", 0], [\"vibrant\", 0], [\"orange\", 0], [\"sky\", 0.5639], [\"and\", 0], [\"a\", 0.3523], [\"deep\", 0], [\"blue\", 1.3235000000000001], [\"sea,\", 1.2629000000000001], [\"illuminated\", 0.5639], [\"by\", 0], [\"soft\", 0], [\"golden\", 0], [\"hour\", 0], [\"light,\", 0], [\"with\", 0], [\"rich\", 0], [\"textures\", 0], [\"and\", 0], [\"a\", 0], [\"dynamic\", 0.5413], [\"perspective.\", 0.6501]]",
    "alignment_score": 2.937000036239624
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_sd_6984.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_sd_6984.png",
    "word_scores": "[[\"iconic\", 1.1656], [\"manga\", 0.4776], [\"chibi\", 0.7136], [\"frog,\", 0.419], [\"vibrant\", 0.9143], [\"color\", 1.4384000000000001], [\"palette,\", 0], [\"expressive\", 2.801], [\"eyes,\", 0], [\"soft\", 0], [\"golden\", 0], [\"hour\", 0], [\"light,\", 0.4092], [\"dynamic\", 0.3098], [\"perspective,\", 0], [\"trending\", 0], [\"on\", 0], [\"artstation,\", 0.2585], [\"digital\", 0], [\"painting\", 0.6808], [\"by\", 0], [\"kyoto\", 0], [\"animation,\", 0], [\"high\", 0.3698], [\"resolution,\", 0.6766], [\"sharp\", 0], [\"focus\", 0]]",
    "alignment_score": 3.186199903488159
  },
  {
    "image_url": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/images/image_quality_sd_8098.jpg",
    "image_mask_alignment": "https://cdn.smoosense.ai/datasets/text-2-image-feedback/image_mask_alignment/image_quality_sd_8098.png",
    "word_scores": "[[\"seven\", 2.0403000000000002], [\"pixelated\", 0.5219], [\"daggers\", 0], [\"piercing\", 1.1479], [\"a\", 0], [\"pulsating\", 0], [\"heart,\", 0.5928], [\"8-bit\", 0], [\"style,\", 0], [\"vibrant\", 1.1121], [\"colors,\", 0], [\"retro\", 0], [\"game\", 0], [\"graphics,\", 1.0001], [\"dramatic\", 0.5274], [\"chiaroscuro,\", 0.9402999999999999], [\"high\", 0.5947], [\"resolution,\", 1.1588], [\"sharp\", 0], [\"focus,\", 0], [\"dynamic\", 0], [\"perspective\", 0.5695]]",
    "alignment_score": 3.058199882507324
  }
]

interface ExampleText2ImageAlignmentProps {
  className?: string
}

const MARKDOWN_CONTENT = `# Text-to-Image Alignment
SmooSense allows users to visualize and evaluate text-to-image AI performance. 
Its intuitive UI utilizes word scores and visual masks to help pinpoint misalignments between the text and the image, simplifying model analysis.

This example shows human labelers' feedback to text-to-image generation.
Model was given text and generated image.
Human labelers were asked to highlight image areas and words having alignment issues.

## Data Source

Data is excerpted from:
[Rapidata/text-2-image-Rich-Human-Feedback-32k](https://huggingface.co/datasets/Rapidata/text-2-image-Rich-Human-Feedback-32k)

[Rapidata](https://www.rapidata.ai/) can help you get similar human labeling for your data.

---

# Use SmooSense to visualize your data

## Word scores

- Name the column such that it contains \`word_score\`
- Cell values should be string, json dumps of list of word and score pair.
For example:
 \`\`\`
 [["seven", 2.04], ["pixelated", 0.5219], ...]
 \`\`\` 

## Image mask
- Name your column such that it contains \`image_mask\`.
- Save mask data as a grayscale png file and store url in the column.
- Ensure there is a column named \`image_url\` containing the corresponding image.

`

export default function ExampleText2ImageAlignment({ className }: ExampleText2ImageAlignmentProps) {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    image_url: {
      headerName: 'Image',
      width: 200,
      pinned: 'left'
    },
    image_mask_alignment: {
      headerName: 'Mask of alignment error',
      width: 200,
      pinned: 'left'
    },
    word_scores: {
      headerName: 'Word Scores',
      width: 200,
      flex: 1
    },
    alignment_score: {
      headerName: 'Alignment Score',
      width: 150,
    }
  }), [])

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[55, 45]}
        minSize={30}
        maxSize={70}
      >
        <div className="h-full">
          <BasicAGTable
            data={EXAMPLE_DATA}
            colDefOverrides={colDefOverrides}
            gridOptionOverrides={{
              rowHeight: 200
            }}
          />
        </div>
        <div className="h-full p-6 bg-background border-l overflow-y-auto">
          <CustomMarkdown>{MARKDOWN_CONTENT}</CustomMarkdown>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 text-foreground">Data in this page</h3>
            <div className="h-[500px] border border-border rounded-lg">
              <JsonBox src={EXAMPLE_DATA} />
            </div>
          </div>
        </div>
      </ResizablePanels>
    </div>
  )
}