'use client'

import { useState, useMemo } from 'react'
import { useAg, useSingleColumnRenderType } from '@/lib/hooks'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { Loader2, Database, AlertCircle, GripVertical, Search, Eye, EyeOff, Pin, PinOff } from 'lucide-react'
import { ICONS } from '@/lib/utils/iconUtils'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ColumnMetadataDebugger from './ColumnMetadataDebugger'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BaseColDef } from '@/lib/features/colDefs/agSlice'
import { reorderColumns, toggleColumnVisibility, toggleColumnPin } from '@/lib/features/colDefs/agSlice'

// Helper function to get icon based on render type
function getRenderTypeIcon(renderType: RenderType) {
  switch (renderType) {
    case RenderType.Boolean:
      return ICONS.BOOLEAN
    case RenderType.Date:
      return ICONS.DATE
    case RenderType.Number:
      return ICONS.NUMBER
    case RenderType.ImageUrl:
      return ICONS.IMAGE
    case RenderType.VideoUrl:
      return ICONS.VIDEO
    case RenderType.HyperLink:
      return ICONS.LINK
    case RenderType.IFrame:
      return ICONS.IFRAME
    case RenderType.Json:
      return ICONS.JSON
    case RenderType.Null:
      return ICONS.TYPE
    case RenderType.Text:
      return ICONS.TEXT
    default:
      return ICONS.TYPE
  }
}

// Component to highlight search matches
function HighlightedText({ text, searchTerm }: { text: string; searchTerm: string }) {
  if (!searchTerm.trim()) return <>{text}</>
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

// Sortable item component  
function SortableColumnItem({ colDef, id, searchTerm, onColumnClick }: { colDef: BaseColDef; id: string; searchTerm: string; onColumnClick?: (columnName: string) => void }) {
  const dispatch = useAppDispatch()
  const renderType = useSingleColumnRenderType(colDef.field)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(toggleColumnVisibility(colDef.field))
  }
  
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(toggleColumnPin(colDef.field))
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-column-name={colDef.field}
      className={`group relative flex items-center gap-1 py-2 pr-2 pl-1 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50 bg-muted' : ''
      } ${colDef.hide ? 'opacity-50' : ''} ${
        colDef.pinned === 'left' ? 'bg-muted border' : ''
      }`}
      onClick={() => onColumnClick?.(colDef.field)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      {getRenderTypeIcon(renderType)}
      <span className="text-sm font-medium text-foreground truncate flex-1 pr-1">
        <HighlightedText text={colDef.field} searchTerm={searchTerm} />
      </span>
      
      {/* Floating action buttons that appear on hover */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm rounded border shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-muted-foreground/20"
          onClick={handleToggleVisibility}
          title={colDef.hide ? 'Show column' : 'Hide column'}
        >
          {colDef.hide ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-muted-foreground/20"
          onClick={handleTogglePin}
          title={colDef.pinned === 'left' ? 'Unpin column' : 'Pin column to left'}
        >
          {colDef.pinned === 'left' ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}

interface ColumnNavigationProps {
  onColumnClick?: (columnName: string) => void
}


const ColumnNavigation = ({ onColumnClick }: ColumnNavigationProps) => {
  const dispatch = useAppDispatch()
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const debugMode = useAppSelector((state) => state.ui.debugMode)
  const { ag: colDefs, loading, error, columns } = useAg()
  const [searchTerm, setSearchTerm] = useState('')
  const [showMatchedOnly, setShowMatchedOnly] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Create ordered columns based on colDefs order, with pinned columns first
  const orderedColumns = useMemo(() => {
    if (!colDefs || colDefs.length === 0) return []
    
    const orderedColDefs: BaseColDef[] = []
    
    // First pass: add pinned columns in their original order
    colDefs.forEach(colDef => {
      if (colDef.pinned === 'left') {
        orderedColDefs.push(colDef)
      }
    })
    
    // Second pass: add non-pinned columns in their original order
    colDefs.forEach(colDef => {
      if (colDef.pinned !== 'left') {
        orderedColDefs.push(colDef)
      }
    })
    
    return orderedColDefs
  }, [colDefs])

  // Filter columns based on search term
  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return orderedColumns
    
    const filtered = orderedColumns.filter(colDef =>
      colDef.field.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return showMatchedOnly ? filtered : orderedColumns
  }, [orderedColumns, searchTerm, showMatchedOnly])

  // Count of matched columns
  const matchedCount = useMemo(() => {
    if (!searchTerm.trim()) return orderedColumns.length
    return orderedColumns.filter(colDef =>
      colDef.field.toLowerCase().includes(searchTerm.toLowerCase())
    ).length
  }, [orderedColumns, searchTerm])


  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id && colDefs) {
      const currentOrder = colDefs.map(colDef => colDef.field)
      const oldIndex = currentOrder.findIndex((field) => field === active.id)
      const newIndex = currentOrder.findIndex((field) => field === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
        dispatch(reorderColumns(newOrder))
      }
    }
  }

  if (!tablePath) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No file selected</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Loading columns...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Error loading columns</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-muted/30">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Column Navigation
            </h3>
            {debugMode && columns.length > 0 && (
              <ColumnMetadataDebugger columns={columns} />
            )}
          </div>
          
          {/* Search Filter */}
          {orderedColumns.length > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              
              {searchTerm.trim() && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {matchedCount} of {orderedColumns.length} columns
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMatchedOnly(!showMatchedOnly)}
                    className="h-6 px-2 text-xs"
                  >
                    {showMatchedOnly ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {showMatchedOnly ? 'Show All' : 'Matched Only'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Column List */}
      <div className="flex-1 overflow-auto">
        {orderedColumns.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No columns found</p>
          </div>
        ) : filteredColumns.length === 0 && searchTerm.trim() ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No columns match &ldquo;{searchTerm}&rdquo;</p>
          </div>
        ) : (
          <div className="p-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredColumns.map(colDef => colDef.field)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {filteredColumns.map((colDef) => (
                    <SortableColumnItem
                      key={colDef.field}
                      id={colDef.field}
                      colDef={colDef}
                      searchTerm={searchTerm}
                      onColumnClick={onColumnClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  )
}

ColumnNavigation.displayName = 'ColumnNavigation'

export default ColumnNavigation