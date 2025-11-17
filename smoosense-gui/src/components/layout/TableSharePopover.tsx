'use client'

import { Share2 } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import AutoLink from '@/components/common/AutoLink'
import CopyToClipboard from '@/components/ui/CopyToClipboard'
import { useAppSelector } from '@/lib/hooks'
import { omit, pickBy, isEmpty, isNil } from 'lodash'

function TableSharePopoverContent() {
  const uiState = useAppSelector((state) => state.ui)

  // Construct the URL
  const constructShareUrl = () => {
    const baseUrl = window.location.origin

    // Excluded keys
    const excludedKeys: Array<keyof typeof uiState> = [
        'baseUrl', 'sqlQuery', 'sqlResult',
        'boxPlotSorting' // Temporarily exclude this complex type data.
    ]

    // Filter out excluded keys and empty values
    const filteredState = pickBy(
      omit(uiState, excludedKeys),
      (value) => {
        if (isNil(value) || value === '') return false
        if (Array.isArray(value) && isEmpty(value)) return false
        return true
      }
    )

    // Convert to URL params
    const params = new URLSearchParams()
    Object.entries(filteredState).forEach(([key, value]) => {
      params.set(key, String(value))
    })

    const queryString = params.toString()
    return `${baseUrl}/Table${queryString ? `?${queryString}` : ''}`
  }

  const shareUrl = constructShareUrl()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Share Table View</h3>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Share this link to open the same table with current settings:
        </p>
        <div className="flex items-center gap-2">
          <CopyToClipboard value={shareUrl} />
          <AutoLink url={shareUrl} className="flex-1" />
        </div>
      </div>
    </div>
  )
}

export default function TableSharePopover() {
  return (
    <IconPopover
      icon={<Share2 />}
      tooltip="Share"
      contentClassName="w-96 p-4"
      align="end"
    >
      <TableSharePopoverContent />
    </IconPopover>
  )
}