'use client'

import ExampleText2ImageAlignment from '@/lib/example/ExampleText2ImageAlignment'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'

export default function ExampleText2ImagePage() {
  return (
    <ExamplePageLayout title="Text-to-Image Alignment Example">
      <ExampleText2ImageAlignment />
    </ExamplePageLayout>
  )
}