'use client'

import HomeNavBar from '@/components/layout/HomeNavBar'
import BackToWork from '@/components/home/BackToWork'
import HomeInfoSection from '@/components/home/HomeInfoSection'
import ExampleVisualization from '@/components/home/ExampleVisualization'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HomeNavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">

          <BackToWork />

          <HomeInfoSection />

          <ExampleVisualization />
        </div>
      </main>
    </div>
  );
}
