'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ExampleAudioMelSpectrogram from '@/lib/example/ExampleAudioMelSpectrogram'
import ExamplePageLayout from '@/components/layout/ExamplePageLayout'

function AudioMelSpectrogramContent() {
  const searchParams = useSearchParams()
  const visualOnly = searchParams.get('visualOnly') === 'true'

  return <ExampleAudioMelSpectrogram visualOnly={visualOnly} />
}

export default function ExampleAudioMelSpectrogramPage() {
  return (
    <ExamplePageLayout title="Audio Mel-Spectrogram Example (ESC-50 subset)">
      <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
        <AudioMelSpectrogramContent />
      </Suspense>
    </ExamplePageLayout>
  )
}
