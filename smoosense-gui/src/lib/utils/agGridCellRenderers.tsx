'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import type { BaseColDef } from '@/lib/features/colDefs/agSlice'
import _ from 'lodash'
import { inferRenderTypeFromData } from './renderTypeUtils'
export { inferRenderTypeFromData }
import ImageCellRenderer from './cellRenderers/ImageCellRenderer'
import VideoCellRenderer from './cellRenderers/VideoCellRenderer'
import AudioCellRenderer from './cellRenderers/AudioCellRenderer'
import PdfCellRenderer from './cellRenderers/PdfCellRenderer'
import IFrameCellRenderer from './cellRenderers/IFrameCellRenderer'
import ComplexDataCellRenderer from './cellRenderers/ComplexDataCellRenderer'
import ImageListCellRenderer from './cellRenderers/ImageListCellRenderer'
import VideoListCellRenderer from './cellRenderers/VideoListCellRenderer'
import AudioListCellRenderer from './cellRenderers/AudioListCellRenderer'
import TextCellRenderer from './cellRenderers/TextCellRenderer'
import DefaultCellRenderer from './cellRenderers/DefaultCellRenderer'
import HeaderStatsCellRenderer from './cellRenderers/HeaderStatsCellRenderer'
import BboxCellRenderer from './cellRenderers/BboxCellRenderer'
import ImageMask from '@/components/viz/ImageMask'
import WordScores from '@/components/viz/WordScores'

export enum RenderType {
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  ImageUrl = 'imageUrl',
  VideoUrl = 'videoUrl',
  AudioUrl = 'audioUrl',
  PdfUrl = 'pdfUrl',
  IFrame = 'iframe',
  HyperLink = 'hyperLink',
  Json = 'json',
  ImageList = 'imageList',
  VideoList = 'videoList',
  AudioList = 'audioList',
  Null = 'null',
  ImageMask = 'imageMask',
  WordScores = 'wordScores',
  Bbox = 'bbox'
}

interface CellRendererProps {
  value: unknown
  type: RenderType
  nodeData?: Record<string, unknown>
}

function CellRenderer({ value, type, nodeData }: CellRendererProps) {
  // Use specialized renderers for specific types
  switch (type) {
    case RenderType.ImageUrl:
      return <ImageCellRenderer value={value}/>
    case RenderType.ImageMask:
      if (nodeData && 'image_url' in nodeData) {
        return <ImageMask image_url={String(nodeData.image_url)} mask_url={String(value)} />
      }
      return <ImageCellRenderer value={value}/>
    case RenderType.VideoUrl:
      return <VideoCellRenderer value={value}/>
    case RenderType.AudioUrl:
      return <AudioCellRenderer value={value}/>
    case RenderType.PdfUrl:
      return <PdfCellRenderer value={value}/>
    case RenderType.IFrame:
      return <IFrameCellRenderer value={value}/>
    case RenderType.Json:
      return <ComplexDataCellRenderer value={value}/>
    case RenderType.ImageList:
      return <ImageListCellRenderer value={value as string[]}/>
    case RenderType.VideoList:
      return <VideoListCellRenderer value={value as string[]}/>
    case RenderType.AudioList:
      return <AudioListCellRenderer value={value as string[]}/>
    case RenderType.WordScores:
      return <WordScores value={String(value)}/>
    case RenderType.Bbox:
      return <BboxCellRenderer value={value} nodeData={nodeData}/>
    case RenderType.Text:
      return <TextCellRenderer value={value}/>
    default:
      return <DefaultCellRenderer value={value} type={type}/>
  }
}

export function createCellRenderer(type: RenderType) {
  const TypedCellRenderer = (params: ICellRendererParams) => (
    <CellRenderer value={params.value} type={type} nodeData={params.node?.data} />
  )
  
  TypedCellRenderer.displayName = `CellRenderer_${type}`
  return TypedCellRenderer
}

// Cell renderer selector that chooses between regular cell renderer and header stats
export function createCellRendererSelector(type: RenderType) {
  const CellRendererSelector = (params: ICellRendererParams) => {
    // Check if this is the pinned top row (header stats row)
    // In this AG Grid version, check for the isTopRow flag in data
    const isPinnedTopRow = Boolean(params.data?.isTopRow)

    if (isPinnedTopRow) {
      return <HeaderStatsCellRenderer {...params} />
    }

    // Use regular cell renderer for normal rows
    return <CellRenderer value={params.value} type={type} nodeData={params.node?.data} />
  }
  
  CellRendererSelector.displayName = `CellRendererSelector_${type}`
  return CellRendererSelector
}

export function expandColDef(type: RenderType, baseColDef?: BaseColDef) {
  // Disable sorting for visual columns (Image, Video, Audio, Iframe, Bbox)
  const isVisualColumn = [RenderType.ImageUrl, RenderType.ImageMask, RenderType.VideoUrl, RenderType.AudioUrl, RenderType.IFrame, RenderType.Bbox].includes(type)

  const colDef: ColDef = {
    minWidth: 50,
    cellRenderer: createCellRendererSelector(type),
    ...(isVisualColumn && { sortable: false }),
    cellStyle: {
      padding: '1px',
      ...(baseColDef?.pinned === 'left' && {
        backgroundColor: 'var(--muted)',
        borderRight: '1px solid var(--border)'
      })
    },
    headerStyle: {
      paddingLeft: '8px',
      ...(baseColDef?.pinned === 'left' && {
        backgroundColor: 'var(--muted)',
        borderRight: '1px solid var(--border)'
      })
    }
  }
  return colDef
}

export function recommendColumnWidth(type: RenderType) {
  if ([RenderType.ImageUrl, RenderType.ImageMask, RenderType.VideoUrl, RenderType.AudioUrl, RenderType.Boolean].includes(type)) {
    return 100
  }
  return 150
}

export function inferColumnDefinitions(data: Record<string, unknown>[]): ColDef[] {
  if (data.length === 0) return []
  
  const firstRow = data[0]
  
  const columns = _.map(firstRow, (value, key) => {
    const columnValues = data.map(row => row[key])
    const type = inferRenderTypeFromData(columnValues, key)
    return {
      field: key,
      headerName: key,
      ...expandColDef(type),
      width: recommendColumnWidth(type),
    }
  })
  
  return columns
}

