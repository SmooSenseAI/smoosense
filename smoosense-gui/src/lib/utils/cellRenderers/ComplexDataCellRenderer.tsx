'use client'

import { memo } from 'react'
import JsonCellRenderer from './JsonCellRenderer'
import BulletListCellRenderer from './BulletListCellRenderer'
import ImageListCellRenderer from './ImageListCellRenderer'
import VideoListCellRenderer from './VideoListCellRenderer'
import AudioListCellRenderer from './AudioListCellRenderer'
import { isAllUrlType } from '../urlUtils'
import { FileType } from '../fileTypes'

interface ComplexDataCellRendererProps {
  value: unknown
}

const ComplexDataCellRenderer = memo(function ComplexDataCellRenderer({
  value
}: ComplexDataCellRendererProps) {
  // Check if value is an array of strings
  const isStringArray = Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => typeof item === 'string')

  // If it's a list of strings, check for media URLs first
  if (isStringArray) {
    const strings = value as string[]

    // Check for image list
    if (isAllUrlType(strings, FileType.Image)) {
      return <ImageListCellRenderer value={strings} />
    }

    // Check for video list
    if (isAllUrlType(strings, FileType.Video)) {
      return <VideoListCellRenderer value={strings} />
    }

    // Check for audio list
    if (isAllUrlType(strings, FileType.Audio)) {
      return <AudioListCellRenderer value={strings} />
    }

    // Fall back to bullet list for non-media strings
    return <BulletListCellRenderer value={strings} />
  }

  // Default to JsonCellRenderer for other cases
  return <JsonCellRenderer value={value} />
})

export default ComplexDataCellRenderer
