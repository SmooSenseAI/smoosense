'use client'

import { FolderOpen, ChevronRight, MoreHorizontal } from 'lucide-react'
import FolderTreeView from './FolderTreeView'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setFileInfoToShow } from '@/lib/features/ui/uiSlice'
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
  
  // Get current root folder from Redux state (managed by FolderUrlParamsProvider)
  const rootFolder = useAppSelector(state => state.ui.rootFolder)
  
  // Helper function to create breadcrumb items
  const createBreadcrumbItems = (path: string) => {
    if (!path) {
      return []
    }
    
    const items = []
    
    // Get parent and grandparent using pathParent
    const parent = pathParent(path)
    const grandparent = pathParent(parent)
    
    // Check if we need ellipsis (more than 2 levels deep)
    const needsEllipsis = grandparent && grandparent !== parent && pathParent(grandparent) !== grandparent
    
    if (needsEllipsis) {
      items.push({ name: '...', path: '', isEllipsis: true })
    }
    
    // Add grandparent if it exists and is different from parent
    if (grandparent && grandparent !== parent) {
      const grandparentName = pathBasename(grandparent) || grandparent
      items.push({ name: grandparentName, path: grandparent, isEllipsis: false })
    }
    
    // Add parent if it exists and is different from current path
    if (parent && parent !== path) {
      const parentName = pathBasename(parent) || parent
      items.push({ name: parentName, path: parent, isEllipsis: false })
    }
    
    return items
  }
  
  const breadcrumbItems = createBreadcrumbItems(rootFolder || '~')
  
  const handleBreadcrumbClick = (path: string) => {
    const url = `./FolderBrowser?rootFolder=${encodeURIComponent(path)}`
    window.open(url, '_blank')
  }
  return (
    <div className="h-full w-full border-r bg-muted/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-sm">Folder Navigation</h3>
        </div>

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
                  <span className="truncate">
                    {item.name}
                  </span>
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