'use client'

import { Suspense } from 'react'
import ExampleEmbAudio from '@/lib/example/ExampleEmbAudio'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'

function EmbAudioContent() {
  return <ExampleEmbAudio />
}

export default function ExampleEmbAudioPage() {
  return (
    <ExamplePageLayout title="Audio Embedding UMAP Example (subset of ESC-50)">
      <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
        <EmbAudioContent />
      </Suspense>
    </ExamplePageLayout>
  )
}
