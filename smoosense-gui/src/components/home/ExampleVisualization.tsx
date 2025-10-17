'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ExampleCard {
  title: string
  href?: string
  tags: string[]
  comingSoon?: boolean
}

const EXAMPLES: ExampleCard[] = [
  {
    title: 'Text-to-Image Alignment',
    href: '/example/text2image',
    tags: ['image', 'image_mask', 'word_scores']
  },
  {
    title: 'Text-to-Video Compare',
    href: '/example/text2video',
    tags: ['video', 'image']
  },
  {
    title: 'Object Detection with bounding box',
    href: '/example/objectdetection',
    tags: ['bbox', 'image']
  },
  {
    title: '3D Objects',
    tags: ['3d'],
    comingSoon: true
  },
  {
    title: 'Pose Skeleton',
    tags: ['skeleton'],
    comingSoon: true
  }
]

export default function ExampleVisualization() {
  return (
    <div className="max-w-4xl w-full mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-6">Examples of multimodal visualization</h2>

      <div className="flex flex-wrap gap-4">
        {EXAMPLES.map((example, index) => {
          const cardContent = (
            <>
              <h3 className="text-base font-medium text-foreground mb-3">
                {example.title}
                {example.comingSoon && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (coming soon)
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {example.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )

          if (example.comingSoon || !example.href) {
            return (
              <div
                key={index}
                className="block w-[200px] p-4 border border-border rounded-lg bg-background opacity-60 cursor-not-allowed"
              >
                {cardContent}
              </div>
            )
          }

          return (
            <Link
              key={index}
              href={example.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-[200px] p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all duration-200 bg-background"
            >
              {cardContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}