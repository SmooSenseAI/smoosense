'use client'

import { ExampleTile } from '@/components/example-collage'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'
import {
  ImageMaskVisual,
  ImageMaskDescription,
  VideoSideBySideVisual,
  VideoSideBySideDescription,
  AudioSpectrogramVisual,
  AudioSpectrogramDescription,
  RoboticsMotionVisual,
  RoboticsMotionDescription,
  Model3DVisual,
  Model3DDescription,
  BoundingBoxVisual,
  BoundingBoxDescription,
  JsonTreeVisual,
  JsonTreeDescription,
} from '@/components/example-collage/examples'

const examples = [
  {
    id: 'image-mask',
    title: 'Image Mask with Word Score',
    description: <ImageMaskDescription />,
    visual: <ImageMaskVisual />,
    colSpan: 2 as const,
    rowSpan: 2 as const,
  },
  {
    id: 'video-side-by-side',
    title: 'Video Play Side-by-Side',
    description: <VideoSideBySideDescription />,
    visual: <VideoSideBySideVisual />,
    colSpan: 1 as const,
    rowSpan: 2 as const,
  },
  {
    id: 'audio-spectrogram',
    title: 'Audio Mel-Spectrogram',
    description: <AudioSpectrogramDescription />,
    visual: <AudioSpectrogramVisual />,
    colSpan: 1 as const,
    rowSpan: 1 as const,
  },
  {
    id: 'robotics-motion',
    title: 'Robotics Motion',
    description: <RoboticsMotionDescription />,
    visual: <RoboticsMotionVisual />,
    colSpan: 1 as const,
    rowSpan: 1 as const,
  },
  {
    id: '3d-models',
    title: '3D Models (from glb file)',
    description: <Model3DDescription />,
    visual: <Model3DVisual />,
    colSpan: 1 as const,
    rowSpan: 2 as const,
  },
  {
    id: 'bounding-box',
    title: 'Object Detection Bounding Box',
    description: <BoundingBoxDescription />,
    visual: <BoundingBoxVisual />,
    colSpan: 1 as const,
    rowSpan: 2 as const,
  },
  {
    id: 'json-tree',
    title: 'JSON Tree View',
    description: <JsonTreeDescription />,
    visual: <JsonTreeVisual />,
    colSpan: 1 as const,
    rowSpan: 2 as const,
  },
]

export default function CollagePage() {
  return (
    <ExamplePageLayout title="Multimodal visualizations, integrated with table and gallery">
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
          {examples.map((example) => (
            <ExampleTile
              key={example.id}
              title={example.title}
              description={example.description}
              visual={example.visual}
              colSpan={example.colSpan}
              rowSpan={example.rowSpan}
            />
          ))}
        </div>
      </div>
    </ExamplePageLayout>
  )
}
