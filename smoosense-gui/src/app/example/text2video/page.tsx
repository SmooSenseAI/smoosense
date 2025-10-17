'use client'

import { useEffect } from 'react'
import ExampleText2VideoCompare from '@/lib/example/ExampleText2VideoCompare'
import NavbarSkeleton from '@/components/layout/NavbarSkeleton'

export default function ExampleText2VideoPage() {
  // Set document title
  useEffect(() => {
    document.title = 'Text-to-Video Comparison Example - SmooSense'
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton
        iconButtons={[]}
      />
      <main className="h-[calc(100vh-56px)] p-4">
        <div className="h-full">
          <ExampleText2VideoCompare />
        </div>
      </main>
    </div>
  )
}