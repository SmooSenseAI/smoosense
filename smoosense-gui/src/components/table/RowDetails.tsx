'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import JsonBox from '@/components/ui/JsonBox'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { List, X } from 'lucide-react'
import { isNil } from 'lodash'
import { useRenderType } from '@/lib/hooks'
import { useProcessedRowData } from '@/lib/hooks/useProcessedRowData'
import AutoLink from '@/components/common/AutoLink'
import { setShowRowDetailsPanel } from '@/lib/features/ui/uiSlice'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import { proxyedUrl } from '@/lib/utils/urlUtils'

interface RowDetailsWrapperProps {
  children: React.ReactNode
}

function RowDetailsWrapper({ children }: RowDetailsWrapperProps) {
  const dispatch = useAppDispatch()

  const handleClosePanel = () => {
    dispatch(setShowRowDetailsPanel(false))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <List className="h-4 w-4" />
            Row Details
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClosePanel}
            className="h-6 px-2 text-xs"
            title="Close row details panel"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}



function renderValueByType(value: unknown, renderType: RenderType): React.ReactNode {
  if (value === null) return <span className="text-muted-foreground italic">null</span>
  if (value === undefined) return <span className="text-muted-foreground italic">undefined</span>
  
  switch (renderType) {
    case RenderType.Json:
      if (typeof value === 'object' && !isNil(value)) {
        return <JsonBox src={value as object} />
      }
      // If it's not an object, try to parse it as JSON string
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return <JsonBox src={parsed} />
        } catch {
          // If parsing fails, show as regular text
          return <span className="text-sm font-mono">{value}</span>
        }
      }
      return <span className="text-sm font-mono">{String(value)}</span>
    
    case RenderType.ImageUrl:
      if (typeof value === 'string') {
        return (
          <div>
            <AutoLink url={value} className="text-xs font-mono" />
          </div>
        )
      }
      return <span className="text-sm font-mono">{String(value)}</span>
    
    case RenderType.IFrame:
      if (typeof value === 'string') {
        return <AutoLink url={value} className="text-xs font-mono" />
      }
      return <span className="text-sm font-mono">{String(value)}</span>
    
    case RenderType.VideoUrl:
      if (typeof value === 'string') {
        return (
          <div>
            <AutoLink url={value} className="text-xs font-mono" />
          </div>
        )
      }
      return <span className="text-sm font-mono">{String(value)}</span>

    case RenderType.AudioUrl:
      if (typeof value === 'string') {
        const audioUrl = proxyedUrl(value)
        return (
          <div className="space-y-2">
            <AudioPlayer
              src={audioUrl}
              showJumpControls={false}
              customAdditionalControls={[]}
              layout="horizontal-reverse"
            />
            <AutoLink url={value} className="text-xs font-mono" />
          </div>
        )
      }
      return <span className="text-sm font-mono">{String(value)}</span>

    case RenderType.Boolean:
      return <span className={`font-medium`}>{String(value)}</span>
    
    case RenderType.Number:
      return <span className="font-mono">{String(value)}</span>
    
    default:
      return <span className="text-sm font-mono">{String(value)}</span>
  }
}

export default function RowDetails() {
  // Get data from Redux store (using processed data that includes derived columns)
  const justClickedRowId = useAppSelector((state) => state.viewing.justClickedRowId)
  const { data: rowData } = useProcessedRowData()
  const columnDefs = useAppSelector((state) => state.ag.columnDefs)
  const renderTypeColumns = useRenderType()

  // Get the selected row data
  const selectedRow = !isNil(justClickedRowId) && rowData
    ? rowData[parseInt(justClickedRowId)]
    : null

  if (!selectedRow) {
    return (
      <RowDetailsWrapper>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Row Selected</p>
            <p className="text-sm">Click a row to see details of all columns</p>
          </div>
        </div>
      </RowDetailsWrapper>
    )
  }

  // Get ordered and visible columns based on columnDefs
  const orderedVisibleColumns = columnDefs
    ? columnDefs
        .filter(colDef => !colDef.hide) // Only show visible columns
        .map(colDef => colDef.field) // Get field names in order
        .filter(field => field in selectedRow) // Only include fields that exist in the row
    : Object.keys(selectedRow) // Fallback to row keys if no columnDefs

  // Convert to key-value pairs in the correct order
  const rowEntries = orderedVisibleColumns.map(key => [key, selectedRow[key]] as [string, unknown])

  return (
    <RowDetailsWrapper>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {rowEntries.map(([key, value]) => {
            const renderType = renderTypeColumns[key] || RenderType.Text

            return (
              <Card key={key} className="border border-border/50 hover:border-border transition-colors">
                <CardHeader className="pb-1 px-3 py-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <span className="truncate">{key}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-2">
                  <div className="text-sm text-foreground break-words max-h-[450px] overflow-y-auto">
                    {renderValueByType(value, renderType)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </RowDetailsWrapper>
  )
}