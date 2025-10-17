'use client'

import { useState, memo, useEffect } from 'react'

interface ImageMaskProps {
  image_url: string
  mask_url: string
  alt?: string
}

const ImageMask = memo(function ImageMask({ image_url, mask_url, alt = "Image with mask overlay" }: ImageMaskProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [maskError, setMaskError] = useState(false)

  // Reset mask error when URLs change
  useEffect(() => {
    setMaskError(false)
  }, [image_url, mask_url])

  // Don't render anything if mask_url is invalid
  if (maskError) {
    return null
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base image */}
      <img
        src={image_url}
        alt={alt}
        className="max-w-full h-auto block"
      />

      {/* Mask overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url(${mask_url})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          filter: 'contrast(1) brightness(10)',
        }}
      />

      {/* Hidden image to detect mask loading errors */}
      <img
        src={mask_url}
        alt=""
        className="hidden"
        onError={() => setMaskError(true)}
      />
    </div>
  )
})

export default ImageMask