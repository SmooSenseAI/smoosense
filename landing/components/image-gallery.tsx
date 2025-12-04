'use client'

import { Box } from '@chakra-ui/react'
import { useState } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'

interface GalleryImage {
  src: string
  caption: string
}

// Custom styles for lightbox - only inject once
if (typeof window !== 'undefined' && !document.getElementById('image-gallery-styles')) {
  const styleTag = document.createElement('style')
  styleTag.id = 'image-gallery-styles'
  styleTag.innerHTML = `
    .yarl__slide {
      background: rgba(0, 0, 0, 0.95);
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .custom-slide-container {
      max-width: 90%;
      max-height: 90%;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .custom-slide-image {
      width: 100%;
      height: auto;
      display: block;
    }

    .custom-slide-caption {
      background: linear-gradient(to bottom, #2d2d2d, #1a1a1a);
      color: white;
      padding: 20px 30px;
      text-align: center;
      font-size: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .yarl__slide_captions_container {
      text-align: center;
    }
  `
  document.head.appendChild(styleTag)
}

interface ImageGalleryProps {
  images: GalleryImage[]
  thumbnailHeight?: string // e.g., "200px", "300px"
  maxColumns?: number     // maximum items per row (default: 3)
}

export function ImageGallery({
  images,
  thumbnailHeight = '200px',
  maxColumns = 3
}: ImageGalleryProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // Convert images to lightbox format
  const slides = images.map(img => ({
    src: img.src,
    title: img.caption,
    description: img.caption,
  }))

  // Calculate columns: when there's only 1 item, treat as 2 for layout
  const displayColumns = images.length === 1 ? 2 : Math.min(images.length, maxColumns)


  return (
    <>
      {/* Gallery Grid */}
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${displayColumns}, 1fr)`}
        gap={8}
        my={5}
        className="image-gallery-container"
      >
        {images.map((image, idx) => (
          <Box
            key={idx}
            cursor="pointer"
            textAlign="center"
            onClick={() => {
              setIndex(idx)
              setOpen(true)
            }}
            transition="transform 0.2s"
            _hover={{ transform: 'scale(1.05)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.caption}
              style={{
                width: '100%',
                height: thumbnailHeight,
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block'
              }}
            />
            <Box
              mt={2}
              color="gray.400"
            >
              {image.caption}
            </Box>
          </Box>
        ))}

        {/* Invisible placeholder when only 1 item */}
        {images.length === 1 && (
          <Box visibility="hidden" />
        )}
      </Box>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Captions]}
        carousel={{
          finite: images.length <= 1,
        }}
        render={{
          slide: ({ slide }) => (
            <Box position="relative" width="100%" height="100%">
              <Image
                src={slide.src}
                alt={slide.title as string}
                fill
                style={{ objectFit: 'contain' }}
                className="custom-slide-image"
              />
            </Box>
          ),
        }}
      />
    </>
  )
}
