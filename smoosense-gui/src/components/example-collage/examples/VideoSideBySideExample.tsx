'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'

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

export function VideoSideBySideVisual() {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    prompt_image: {
      headerName: 'Image',
      width: 100,
      pinned: 'left',
      hide: true,
    },
    prompt: {
      headerName: 'Prompt',
      width: 120,
      flex: 1
    },
    video1: {
      headerName: 'Model 1',
      width: 120
    },
    video2: {
      headerName: 'Model 2',
      width: 120
    },
    video1_preference: {
      headerName: 'Pref',
      width: 60
    }
  }), [])

  return (
    <div className="w-full h-full">
      <BasicAGTable
        data={EXAMPLE_DATA}
        colDefOverrides={colDefOverrides}
        gridOptionOverrides={{
          rowHeight: 100
        }}
      />
    </div>
  )
}

export function VideoSideBySideDescription() {
  return (
    <div className="text-sm">
      <p>Compare videos from different models side-by-side for quality assessment and human preference evaluation.</p>
    </div>
  )
}
