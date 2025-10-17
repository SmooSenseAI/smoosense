'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, ArrowUpDown, Search, X } from 'lucide-react'
import ReactJson from '@smoosense/react-json-view'
import { filterJsonData } from '@/lib/utils/jsonFilter'
import { useTheme } from 'next-themes'

interface JsonBoxProps {
  src: object
  className?: string
  showControls?: boolean
}

export default function JsonBox({ src, className = '', showControls = true }: JsonBoxProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  const [sortKeys, setSortKeys] = useState(false)
  const [collapsedLevel, setCollapsedLevel] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleIncreaseCollapsed = () => {
    setCollapsedLevel(prev => Math.min(prev + 1, 10)) // Max 10 levels
  }

  const handleDecreaseCollapsed = () => {
    setCollapsedLevel(prev => Math.max(prev - 1, 0)) // Min 0 levels
  }

  const toggleSortKeys = () => {
    setSortKeys(prev => !prev)
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  // Filter JSON data based on search term
  const filteredData = useMemo(() => {
    return filterJsonData(src, searchTerm)
  }, [src, searchTerm])

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Control buttons row - conditionally rendered */}
      {showControls && (
        <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
          {/* Search input */}
          <div className="flex items-center gap-1 flex-1 max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-7 h-8 text-xs"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <Button
            variant={sortKeys ? "default" : "outline"}
            size="sm"
            onClick={toggleSortKeys}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort Keys
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecreaseCollapsed}
              disabled={collapsedLevel <= 0}
              className="px-2"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
              Level {collapsedLevel}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncreaseCollapsed}
              disabled={collapsedLevel >= 10}
              className="px-2"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* JSON viewer */}
      <div className="flex-1 overflow-auto p-4">
        <ReactJson
          src={filteredData}
          theme={isDark ? 'monokai' : 'rjv-default'}
          iconStyle="triangle"
          indentWidth={2}
          collapsed={searchTerm.trim() ? false : collapsedLevel}
          displayObjectSize={true}
          displayDataTypes={false}
          collapseStringsAfterLength={100}
          enableClipboard={true}
          groupArraysAfterLength={100}
          numberOfArrayGroupsToDisplay={1}
          displayArrayKey={false}
          sortKeys={sortKeys}
          style={{
            backgroundColor: 'transparent'
          }}
        />
      </div>
    </div>
  )
}