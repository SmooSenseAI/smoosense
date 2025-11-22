'use client'

import { memo } from 'react'
import { isAllUrlType } from '@/lib/utils/urlUtils'
import { FileType } from '@/lib/utils/fileTypes'
import { mayResolveUrl } from '@/lib/utils/mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'
import AudioPage from '@/lib/utils/mediaList/AudioPage'
import ImageBlock from '@/components/common/ImageBlock'
import _ from 'lodash'

interface ComplexDataGalleryItemVisualProps {
  value: unknown
  galleryItemHeight: number
}

const ComplexDataGalleryItemVisual = memo(function ComplexDataGalleryItemVisual({
  value,
  galleryItemHeight
}: ComplexDataGalleryItemVisualProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)

  // Check if value is an array of strings
  const isStringArray = Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => typeof item === 'string')

  if (!isStringArray) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2">
        <pre className="text-xs overflow-auto max-h-full">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    )
  }

  const strings = value as string[]
  const validUrls = _.compact(strings.map(url => url.trim()))
  const resolvedUrls = validUrls.map(url =>
    mayResolveUrl({ value: url, tablePath, baseUrl })
  )

  // Check for audio list
  if (isAllUrlType(strings, FileType.Audio)) {
    return (
      <div style={{ height: galleryItemHeight }}>
        <AudioPage resolvedUrls={resolvedUrls} originalUrls={validUrls} columns={2} allowPopOver={true} showName={false} />
      </div>
    )
  }

  // Check for image list
  if (isAllUrlType(strings, FileType.Image)) {
    return (
      <div className="grid grid-cols-2 gap-1 p-1 h-full overflow-auto content-start">
        {resolvedUrls.map((url, index) => (
          <ImageBlock
            key={index}
            src={url}
            alt={validUrls[index]}
            showPopover={true}
            className="w-full h-auto rounded"
          />
        ))}
      </div>
    )
  }

  // Check for video list
  if (isAllUrlType(strings, FileType.Video)) {
    return (
      <div className="grid grid-cols-2 gap-1 p-1 h-full overflow-auto">
        {resolvedUrls.map((url, index) => (
          <video
            key={index}
            src={url}
            className="w-full h-auto object-cover rounded"
            controls
            muted
          />
        ))}
      </div>
    )
  }

  // Fall back to text list for non-media strings
  return (
    <div className="w-full h-full overflow-auto p-2">
      <ul className="text-xs space-y-1">
        {strings.map((str, index) => (
          <li key={index} className="truncate" title={str}>
            {str}
          </li>
        ))}
      </ul>
    </div>
  )
})

export default ComplexDataGalleryItemVisual
