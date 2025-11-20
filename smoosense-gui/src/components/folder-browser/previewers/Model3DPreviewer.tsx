'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Application, Entity } from '@playcanvas/react'
import { Camera, Render, Light } from '@playcanvas/react/components'
import { OrbitControls } from '@playcanvas/react/scripts'
import { useModel } from '@playcanvas/react/hooks'
import { Entity as PcEntity, BoundingBox, RenderComponent, CameraComponent } from 'playcanvas'
import { Loader2 } from 'lucide-react'

interface Model3DPreviewerProps {
  modelUrl: string
}

interface ModelBounds {
  center: [number, number, number]
  radius: number
}

function ModelEntity({
  modelUrl,
  onBoundsCalculated
}: {
  modelUrl: string
  onBoundsCalculated: (bounds: ModelBounds) => void
}) {
  const { asset } = useModel(modelUrl)
  const entityRef = useRef<PcEntity>(null)

  useEffect(() => {
    if (asset && entityRef.current) {
      // Wait a frame for the render component to be set up
      requestAnimationFrame(() => {
        const entity = entityRef.current
        if (!entity) return

        // Get the model's bounding box
        const aabb = new BoundingBox()
        const renders = entity.findComponents('render')

        if (renders.length > 0) {
          // Initialize with first mesh instance bounds
          let initialized = false

          renders.forEach((component) => {
            const render = component as RenderComponent
            if (render.meshInstances) {
              render.meshInstances.forEach((mi) => {
                if (!initialized) {
                  aabb.copy(mi.aabb)
                  initialized = true
                } else {
                  aabb.add(mi.aabb)
                }
              })
            }
          })

          if (initialized) {
            // Calculate bounding sphere radius
            const halfExtents = aabb.halfExtents
            const radius = Math.sqrt(
              halfExtents.x * halfExtents.x +
              halfExtents.y * halfExtents.y +
              halfExtents.z * halfExtents.z
            )

            onBoundsCalculated({
              center: [aabb.center.x, aabb.center.y, aabb.center.z],
              radius
            })
          }
        }
      })
    }
  }, [asset, onBoundsCalculated])

  if (!asset) {
    return null
  }

  return (
    <Entity ref={entityRef}>
      <Render type="asset" asset={asset} />
    </Entity>
  )
}

export default function Model3DPreviewer({ modelUrl }: Model3DPreviewerProps) {
  const [bounds, setBounds] = useState<ModelBounds | null>(null)

  // Reset bounds when modelUrl changes to show spinner
  useEffect(() => {
    setBounds(null)
  }, [modelUrl])

  // Callback ref to enable scene color map immediately when camera entity mounts
  const cameraEntityRef = useCallback((entity: PcEntity | null) => {
    if (entity) {
      const camera = entity.findComponent('camera') as CameraComponent | null
      if (camera) {
        camera.requestSceneColorMap(true)
      }
    }
  }, [])

  const fov = 45

  // Calculate distance to fit model at ~90% of view
  // distance = radius / tan(fov/2) * margin
  const idealDistance = bounds
    ? (bounds.radius / Math.tan((fov / 2) * Math.PI / 180)) * 1.1
    : 2

  // Set distance range based on model size
  const distanceMin = bounds ? bounds.radius * 0.3 : 0.1
  const distanceMax = bounds ? bounds.radius * 50 : 100

  // Camera starts at origin, OrbitControls manages position via distance
  const pivotPoint: [number, number, number] = bounds
    ? [bounds.center[0], bounds.center[1], bounds.center[2]]
    : [0, 0, 0]

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: 'linear-gradient(to bottom, #a8b5c8 0%, #8a9ab0 100%)'
      }}
    >
      {/* Loading spinner */}
      {!bounds && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        </div>
      )}
      <Application key={modelUrl}>
        {/* Camera with orbit controls */}
        <Entity ref={cameraEntityRef} position={[pivotPoint[0], pivotPoint[1], pivotPoint[2] + idealDistance]}>
          <Camera
            clearColor="rgba(0, 0, 0, 0)"
            fov={fov}
          />
          <OrbitControls
            inertiaFactor={0.1}
            distance={idealDistance}
            distanceMin={distanceMin}
            distanceMax={distanceMax}
            pitchAngleMin={-90}
            pitchAngleMax={90}
          />
        </Entity>

        {/* Directional light */}
        <Entity rotation={[45, 30, 0]}>
          <Light type="directional" intensity={2} />
        </Entity>

        {/* Secondary directional light for fill */}
        <Entity rotation={[-30, -120, 0]}>
          <Light type="directional" intensity={0.8} />
        </Entity>

        {/* Ambient lights surrounding the model */}
        <Entity position={[10, 10, 10]}>
          <Light type="omni" intensity={0.5} range={100} />
        </Entity>
        <Entity position={[-10, 10, -10]}>
          <Light type="omni" intensity={0.5} range={100} />
        </Entity>
        <Entity position={[10, -10, -10]}>
          <Light type="omni" intensity={0.5} range={100} />
        </Entity>
        <Entity position={[-10, -10, 10]}>
          <Light type="omni" intensity={0.5} range={100} />
        </Entity>

        {/* 3D Model */}
        <ModelEntity modelUrl={modelUrl} onBoundsCalculated={setBounds} />
      </Application>
    </div>
  )
}
