'use client'

import ExampleObjectDetection from '@/lib/example/ExampleObjectDetection'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'

export default function ExampleObjectDetectionPage() {
  return (
    <ExamplePageLayout title="Object Detection Analysis Example">
      <ExampleObjectDetection />
    </ExamplePageLayout>
  )
}