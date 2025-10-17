'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import UISettingToggle from '@/components/ui/UISettingToggle'

// Placeholder data - 4 rows with columns: prompt_image, prompt, video1, video2
const EXAMPLE_DATA = [
  {
    "prompt_image": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Images/63.jpg",
    "prompt": "The camera gently circles the blooming rose, capturing its petals in soft focus.",
    "video1": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/marey/marey_0063.mp4",
    "video2": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/hailuo-02/hailuo-02_camera-motion_0063.mp4",
    "video1_preference": 0.144156351685524
  },
  {
    "prompt_image": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Images/92.jpg",
    "prompt": "The camera slowly zooms in on the unfurling plant, capturing its vibrant colors and intricate details.",
    "video1": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/marey/marey_0092.mp4",
    "video2": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/hailuo-02/hailuo-02_camera-motion_0092.mp4",
    "video1_preference": 0.12658114731311798
  },
  {
    "prompt_image": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Images/20.jpg",
    "prompt": "Birds soar gracefully across the glowing sunset sky as gentle wind rustles the lone tree's branches.",
    "video1": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/marey/marey_0020.mp4",
    "video2": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/hailuo-02/hailuo-02_scene-motion_0020.mp4",
    "video1_preference": 0.22711089253425598
  },
  {
    "prompt_image": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Images/68.jpg",
    "prompt": "The subject paddles smoothly across the misty lake, creating gentle ripples in the water.",
    "video1": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/marey/marey_0068.mp4",
    "video2": "https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/hailuo-02/hailuo-02_subject-motion_0068.mp4",
    "video1_preference": 0.18394294381141663
  }
]

interface ExampleText2VideoCompareProps {
  className?: string
}

const MARKDOWN_CONTENT = `# Text-to-Video Comparison

SmooSense provides a platform to evaluate and compare different text-to-video AI models. 
By presenting videos generated from the same prompt side-by-side, it allows for a direct visual assessment of each model's quality and performance.

This example shows how to analyze and compare video generation results from multiple models using the same prompts and reference images.

## Data Source

Data is excerpted from:
[Rapidata/image-to-video-human-preference-hailuo-02-marey](https://huggingface.co/datasets/Rapidata/image-to-video-human-preference-hailuo-02-marey)

---

## Use SmooSense to compare videos
- Hover at a video to play.
- Click the switch to turn on/off auto-play for all videos.

`

export default function ExampleText2VideoCompare({ className }: ExampleText2VideoCompareProps) {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    prompt_image: {
      headerName: 'Reference Image',
      width: 250,
      pinned: 'left'
    },
    prompt: {
      headerName: 'Prompt',
      width: 200,
      flex: 1
    },
    video1: {
      headerName: 'Model 1 Video',
      width: 250
    },
    video2: {
      headerName: 'Model 2 Video',
      width: 250
    }
  }), [])

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[70, 30]}
        minSize={50}
        maxSize={80}
      >
        <div className="h-full flex flex-col">
          <div className="w-full flex items-center justify-center p-3">
            <UISettingToggle
              settingKey="autoPlayAllVideos"
              label="Auto Play All Videos"
            />
          </div>
          <div className="flex-1">
            <BasicAGTable
              data={EXAMPLE_DATA}
              colDefOverrides={colDefOverrides}
              gridOptionOverrides={{
                rowHeight: 150
              }}
            />
          </div>
        </div>
        <div className="h-full p-6 bg-background border-l overflow-y-auto">
          <CustomMarkdown>{MARKDOWN_CONTENT}</CustomMarkdown>
        </div>
      </ResizablePanels>
    </div>
  )
}