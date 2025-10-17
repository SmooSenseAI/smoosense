'use client'

import GlobalSettingsDropdown from '@/components/settings/GlobalSettings'

interface LiteTableTopBarProps {
  rowCount: number
  columnCount: number
}

export default function LiteTableTopBar({ rowCount, columnCount }: LiteTableTopBarProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-background h-10">

      {/* Center: Row and Column Count */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{rowCount} rows</span>
        <span>×</span>
        <span>{columnCount} columns</span>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center">
        <GlobalSettingsDropdown context="LiteTable" />
      </div>
    </div>
  )
}
