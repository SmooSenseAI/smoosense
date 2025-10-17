'use client'

import { memo } from 'react'
import { isNil } from 'lodash'
import IFrameCellRenderer from './IFrameCellRenderer'
import DefaultCellRenderer from './DefaultCellRenderer'
import { RenderType } from '../agGridCellRenderers'
import { parseBbox, buildBboxVizUrl } from '@/lib/utils/bboxUtils'
import { useAppSelector } from '@/lib/hooks'

interface BboxCellRendererProps {
  value: unknown
  nodeData?: Record<string, unknown>
}

const BboxCellRenderer = memo(function BboxCellRenderer({
  value,
  nodeData
}: BboxCellRendererProps) {
  const baseUrl = useAppSelector((state) => state.ui.baseUrl)

  // Handle empty or invalid values
  if (isNil(value)) {
    return <DefaultCellRenderer value={value} type={RenderType.Bbox} />
  }

  const bbox = parseBbox(value)

  if (!bbox) {
    return <DefaultCellRenderer value={value} type={RenderType.Bbox} />
  }

  // Check if there's an image_url in the row data
  const imageUrl = nodeData?.image_url

  if (!imageUrl || typeof imageUrl !== 'string') {
    // No image URL, just display the bbox array
    return <DefaultCellRenderer value={JSON.stringify(bbox)} type={RenderType.Text} />
  }

  // Construct the viz-bbox.html URL with image URL and baseUrl
  if (!baseUrl) {
    return <DefaultCellRenderer value={JSON.stringify(bbox)} type={RenderType.Text} />
  }

  const vizUrl = buildBboxVizUrl(imageUrl, [bbox], baseUrl)

  // Use IFrameCellRenderer to display the viz
  return <IFrameCellRenderer value={vizUrl} />
})

export default BboxCellRenderer
