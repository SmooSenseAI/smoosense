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
  }
]

export function VideoSideBySideVisual() {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    prompt_image: {
      headerName: 'Image',
      width: 200,
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
      width: 200
    },
    video2: {
      headerName: 'Model 2',
      width: 200
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
          rowHeight: 120
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
