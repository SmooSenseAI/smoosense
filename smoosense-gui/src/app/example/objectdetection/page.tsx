'use client'

import { useEffect } from 'react'
import ExampleObjectDetection from '@/lib/example/ExampleObjectDetection'
import NavbarSkeleton from '@/components/layout/NavbarSkeleton'

export default function ExampleObjectDetectionPage() {
  // Set document title
  useEffect(() => {
    document.title = 'Object Detection Analysis Example - SmooSense'
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton
        iconButtons={[]}
      />
      <main className="h-[calc(100vh-56px)] p-4">
        <div className="h-full">
          <ExampleObjectDetection />
        </div>
      </main>
    </div>
  )
}