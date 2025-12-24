'use client'

import { Suspense } from 'react'
import ExampleEmbImages from '@/lib/example/ExampleEmbImages'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'

function EmbImagesContent() {
  return <ExampleEmbImages />
}

export default function ExampleEmbImagesPage() {
  return (
    <ExamplePageLayout title="Image Embedding UMAP Example">
      <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
        <EmbImagesContent />
      </Suspense>
    </ExamplePageLayout>
  )
}
