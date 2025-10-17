'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import type { BaseColDef } from '@/lib/features/colDefs/agSlice'
import _, { isNil } from 'lodash'
import { getFileType, FileType } from './fileTypes'
import ImageCellRenderer from './cellRenderers/ImageCellRenderer'
import VideoCellRenderer from './cellRenderers/VideoCellRenderer'
import PdfCellRenderer from './cellRenderers/PdfCellRenderer'
import IFrameCellRenderer from './cellRenderers/IFrameCellRenderer'
import JsonCellRenderer from './cellRenderers/JsonCellRenderer'
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
  PdfUrl = 'pdfUrl',
  IFrame = 'iframe',
  HyperLink = 'hyperLink',
  Json = 'json',
  Null = 'null',
  ImageMask = 'imageMask',
  WordScores = 'wordScores',
  Bbox = 'bbox'
}


// Helper functions for string analysis
function isUrl(str: string): boolean {
  return str.startsWith('http://') ||
         str.startsWith('https://') ||
         str.startsWith('s3://') ||
         str.startsWith('ftp://') ||
         str.startsWith('file://') ||
         str.startsWith('./')
}

function inferUrlType(str: string): RenderType {
  // Extract filename from URL for file type detection
  const urlParts = str.split('/')
  const filename = urlParts[urlParts.length - 1].split('?')[0] // Remove query parameters
  const fileType = getFileType(filename)

  // Check file type first
  if (fileType === FileType.Image) {
    return RenderType.ImageUrl
  }

  if (fileType === FileType.Video) {
    return RenderType.VideoUrl
  }

  if (fileType === FileType.Pdf) {
    return RenderType.PdfUrl
  }

  // Check for video streaming platforms
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(str)) {
    return RenderType.VideoUrl
  }

  // Check for iframe-suitable URLs (e.g., embedded content)
  if (/embed|iframe/.test(str)) {
    return RenderType.IFrame
  }

  // Default to hyperlink for other URLs
  return RenderType.HyperLink
}

function isDateString(str: string): boolean {
  // More strict date validation
  // Check for common date formats: YYYY-MM-DD, MM/DD/YYYY, etc.
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
  ]
  
  // Must match at least one date pattern
  const matchesPattern = datePatterns.some(pattern => pattern.test(str.trim()))
  
  if (!matchesPattern) return false
  
  // Additional validation: must be a valid date
  const dateValue = new Date(str)
  return !isNaN(dateValue.getTime())
}

function isNumberString(str: string): boolean {
  const numValue = Number(str.trim())
  return !isNaN(numValue) && str.trim() !== ''
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
    case RenderType.PdfUrl:
      return <PdfCellRenderer value={value}/>
    case RenderType.IFrame:
      return <IFrameCellRenderer value={value}/>
    case RenderType.Json:
      return <JsonCellRenderer value={value}/>
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

export function inferRenderTypeFromData(columnValues: unknown[], columnName?: string): RenderType {
  // Filter out null and undefined values
  const nonNullValues = columnValues.filter(value => !isNil(value))
  
  if (nonNullValues.length === 0) return RenderType.Null
  
  // Check if all non-null values are booleans
  if (nonNullValues.every(value => typeof value === 'boolean')) {
    return RenderType.Boolean
  }
  
  // Check if all non-null values are numbers
  if (nonNullValues.every(value => typeof value === 'number' && !isNaN(value))) {
    return RenderType.Number
  }
  
  // Check if all non-null values are dates
  if (nonNullValues.every(value => value instanceof Date)) {
    return RenderType.Date
  }

  // Check if all non-null values are objects (but not dates)
  if (nonNullValues.every(value => typeof value === 'object' && !(value instanceof Date))) {
    // Check if column name contains 'bbox' and values are arrays of 4 numbers
    if (columnName && _.includes(columnName.toLowerCase(), 'bbox')) {
      const isBboxFormat = nonNullValues.every(value =>
        _.isArray(value) &&
        value.length === 4 &&
        _.every(value, _.isNumber)
      )

      if (isBboxFormat) {
        return RenderType.Bbox
      }
    }

    return RenderType.Json
  }
  
  // For strings, check if all non-null values match a specific pattern
  if (nonNullValues.every(value => typeof value === 'string')) {
    const stringValues = nonNullValues as string[]
    
    // First check if all strings are URLs, then determine specific URL type
    if (stringValues.every(str => isUrl(str.toLowerCase().trim()))) {
      // All are URLs, now check for specific types
      const normalizedUrls = stringValues.map(str => str.toLowerCase().trim())
      
      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.ImageUrl)) {
        // Check if column name contains 'image_mask' for ImageMask render type
        if (columnName && columnName.includes('image_mask')) {
          return RenderType.ImageMask
        }
        return RenderType.ImageUrl
      }
      
      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.VideoUrl)) {
        return RenderType.VideoUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.PdfUrl)) {
        return RenderType.PdfUrl
      }

      if (normalizedUrls.every(url => inferUrlType(url) === RenderType.IFrame)) {
        return RenderType.IFrame
      }

      // Mixed URL types or all are generic hyperlinks
      return RenderType.HyperLink
    }
    
    if (stringValues.every(str => isDateString(str))) {
      return RenderType.Date
    }
    
    if (stringValues.every(str => isNumberString(str))) {
      return RenderType.Number
    }

    // Check if column name contains 'word_score' for WordScores render type
    if (columnName && columnName.includes('word_score')) {
      return RenderType.WordScores
    }
  }
  
  // Default to Text for mixed types or anything else
  return RenderType.Text
}

export function expandColDef(type: RenderType, baseColDef?: BaseColDef) {
  // Disable sorting for visual columns (Image, Video, Iframe, Bbox)
  const isVisualColumn = [RenderType.ImageUrl, RenderType.ImageMask, RenderType.VideoUrl, RenderType.IFrame, RenderType.Bbox].includes(type)

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
  if([
      RenderType.ImageUrl, RenderType.ImageMask, RenderType.VideoUrl, RenderType.HyperLink,
    RenderType.Boolean
  ].includes(type)) {
    return 100
  } else {
    return 150
  }
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

