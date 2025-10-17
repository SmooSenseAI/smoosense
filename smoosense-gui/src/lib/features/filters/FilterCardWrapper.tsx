'use client'

import { ReactNode } from 'react'

interface FilterCardWrapperProps {
  columnName: string
  isLoading: boolean
  error: string | null
  hasData: boolean
  children: ReactNode
}

export default function FilterCardWrapper({ 
  columnName, 
  isLoading, 
  error, 
  hasData, 
  children 
}: FilterCardWrapperProps) {
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-w-[400px]">
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium">Loading...</h3>
          <div className="text-xs text-muted-foreground">{columnName}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-muted-foreground">Loading statistics...</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-w-[400px]">
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium">Error</h3>
          <div className="text-xs text-muted-foreground">{columnName}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-destructive">Error: {error}</div>
        </div>
      </div>
    )
  }

  // Show no data state
  if (!hasData) {
    return (
      <div className="min-w-[400px]">
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium">No Data</h3>
          <div className="text-xs text-muted-foreground">{columnName}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-muted-foreground">No statistics available</div>
        </div>
      </div>
    )
  }

  // Show the actual filter content
  return (
    <div className="min-w-[400px]">
      {children}
    </div>
  )
}