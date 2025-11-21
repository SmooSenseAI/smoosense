'use client'

import dynamic from 'next/dynamic'

// Dynamic import for Model3DPreviewer to avoid SSR issues
const Model3DPreviewer = dynamic(
  () => import('@/components/folder-browser/previewers/Model3DPreviewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading 3D viewer...
      </div>
    )
  }
)

const MODEL_URL = 'https://cdn.smoosense.ai/demo/pony_cartoon.glb'

export function Model3DVisual() {
  return (
    <div className="w-full h-full">
      <Model3DPreviewer modelUrl={MODEL_URL} />
    </div>
  )
}

export function Model3DDescription() {
  return (
    <div className="text-sm">
      <p>Interactive 3D model viewer with orbit controls for CAD and mesh visualization.</p>
    </div>
  )
}
