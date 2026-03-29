'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, ChevronRight, MoreHorizontal, X } from 'lucide-react'
import FolderTreeView from './FolderTreeView'
import FolderHelpCard from './FolderHelpCard'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setFileInfoToShow } from '@/lib/features/ui/uiSlice'
import { setSortBy, setSortOrder, setFilterPattern, type SortBy, type SortOrder } from '@/lib/features/folderTree/folderTreeSlice'
import { pathParent, pathBasename } from '@/lib/utils/pathUtils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function FolderNavigation() {
  const dispatch = useAppDispatch()
  const fileInfoToShow = useAppSelector(state => state.ui.fileInfoToShow)
  const sortBy = useAppSelector(state => state.folderTree.sortBy)
  const sortOrder = useAppSelector(state => state.folderTree.sortOrder)
  const rootFolder = useAppSelector(state => state.ui.rootFolder)

  const [patternInput, setPatternInput] = useState('')

  // Debounce: dispatch filter 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilterPattern(patternInput))
    }, 300)
    return () => clearTimeout(timer)
  }, [patternInput, dispatch])

  const createBreadcrumbItems = (path: string) => {
    if (!path) return []
    const items = []
    const parent = pathParent(path)
    const grandparent = pathParent(parent)
    const needsEllipsis = grandparent && grandparent !== parent && pathParent(grandparent) !== grandparent
    if (needsEllipsis) {
      items.push({ name: '...', path: '', isEllipsis: true })
    }
    if (grandparent && grandparent !== parent) {
      items.push({ name: pathBasename(grandparent) || grandparent, path: grandparent, isEllipsis: false })
    }
    if (parent && parent !== path) {
      items.push({ name: pathBasename(parent) || parent, path: parent, isEllipsis: false })
    }
    return items
  }

  const breadcrumbItems = createBreadcrumbItems(rootFolder || '~')

  const handleBreadcrumbClick = (path: string) => {
    window.open(`./FolderBrowser?rootFolder=${encodeURIComponent(path)}`, '_blank')
  }

  return (
    <div className="h-full w-full border-r bg-muted/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-sm">Folder Navigation</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort field */}
          <Select
            value={sortBy}
            onValueChange={(value: SortBy) => dispatch(setSortBy(value))}
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="size">Sort: Size</SelectItem>
              <SelectItem value="modified">Sort: Modified</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort direction */}
          <Select
            value={sortOrder}
            onValueChange={(value: SortOrder) => dispatch(setSortOrder(value))}
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">↑ Asc</SelectItem>
              <SelectItem value="desc">↓ Desc</SelectItem>
            </SelectContent>
          </Select>

          {/* File info display */}
          <Select
            value={fileInfoToShow}
            onValueChange={(value: 'size' | 'lastModified' | 'lastModifiedRelative') =>
              dispatch(setFileInfoToShow(value))
            }
          >
            <SelectTrigger className="w-auto h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="lastModified">Modified Date</SelectItem>
              <SelectItem value="lastModifiedRelative">Modified (Relative)</SelectItem>
            </SelectContent>
          </Select>

          <FolderHelpCard />
        </div>
      </div>

      {/* Pattern filter */}
      <div className="px-2 py-1.5 border-b">
        <div className="relative">
          <input
            type="text"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="Filter: *.jpg, data_*, …"
            className="w-full h-7 pl-2 pr-6 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          {patternInput && (
            <button
              onClick={() => setPatternInput('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <nav className="flex items-center space-x-1 text-xs overflow-hidden">
          {breadcrumbItems.map((item, index) => (
            <div key={item.path} className="flex items-center space-x-1 min-w-0">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              {item.isEllipsis ? (
                <div className="flex items-center px-1 py-0.5 text-muted-foreground">
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(item.path)}
                  className="flex items-center space-x-1 px-1 py-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors min-w-0 cursor-pointer"
                  title={item.path}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        <FolderTreeView />
      </div>
    </div>
  )
}
