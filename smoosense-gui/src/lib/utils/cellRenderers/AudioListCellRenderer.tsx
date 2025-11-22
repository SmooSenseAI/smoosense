'use client'

import { memo } from 'react'
import _ from 'lodash'
import CellPopover from '@/components/ui/CellPopover'
import { mayResolveUrl } from '../mediaUrlUtils'
import { useAppSelector } from '@/lib/hooks'
import AudioRow from '../mediaList/AudioRow'
import AudioPage from '../mediaList/AudioPage'

interface AudioListCellRendererProps {
  value: string[]
}

const AudioListCellRenderer = memo(function AudioListCellRenderer({
  value
}: AudioListCellRendererProps) {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)
  const rowHeight = useAppSelector((state) => state.ui.rowHeight)

  // Filter out empty strings and resolve URLs
  const validUrls = _.compact(value.map(url => url.trim()))
  const resolvedUrls = validUrls.map(url =>
    mayResolveUrl({ value: url, tablePath, baseUrl })
  )

  if (resolvedUrls.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
        No audio
      </div>
    )
  }

  return (
    <CellPopover
      cellContent={<AudioRow resolvedUrls={resolvedUrls} height={rowHeight - 8} />}
      popoverContent={<AudioPage resolvedUrls={resolvedUrls} originalUrls={validUrls} />}
      popoverClassName="w-[600px] max-h-[500px] p-0"
      cellContentClassName="items-center justify-center"
      copyValue={validUrls.join('\n')}
      title={`${resolvedUrls.length} audio files`}
    />
  )
})

export default AudioListCellRenderer
