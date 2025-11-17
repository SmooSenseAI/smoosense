'use client'

import { useEffect, ReactNode } from 'react'
import NavbarSkeleton from '@/components/layout/NavbarSkeleton'
import { NAVBAR_HEIGHT } from '@/constants'

interface ExamplePageLayoutProps {
  title: string
  children: ReactNode
}

export default function ExamplePageLayout({ title, children }: ExamplePageLayoutProps) {
  // Set document title
  useEffect(() => {
    document.title = `${title} - SmooSense`
  }, [title])

  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton
        title={title}
        iconButtons={[]}
      />
      <main className="p-4" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
