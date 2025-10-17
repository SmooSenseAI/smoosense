'use client'

import { useEffect } from 'react'
import ExampleText2ImageAlignment from '@/lib/example/ExampleText2ImageAlignment'
import NavbarSkeleton from '@/components/layout/NavbarSkeleton'

export default function ExampleText2ImagePage() {
  // Set document title
  useEffect(() => {
    document.title = 'Text-to-Image Alignment Example - SmooSense'
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton
        iconButtons={[]}
      />
      <main className="h-[calc(100vh-56px)] p-4">
        <div className="h-full">
          <ExampleText2ImageAlignment />
        </div>
      </main>
    </div>
  )
}