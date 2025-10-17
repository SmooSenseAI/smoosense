'use client'

import { useAppSelector } from '@/lib/hooks'
import { parseFilterItem } from '@/lib/utils/sql/parseFilters'
import type { ColumnFilter } from '@/lib/features/colDefs/agSlice'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from 'next-themes'

interface FilterDebugSectionProps {
  columnName: string
  filterData: ColumnFilter
}

export default function FilterDebugSection({
  columnName,
  filterData
}: FilterDebugSectionProps) {
  const debugMode = useAppSelector(state => state.ui.debugMode)
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

  if (!debugMode) {
    return null
  }

  // Convert filter to SQL string
  let sqlString: string | null = null
  try {
    sqlString = parseFilterItem(columnName, filterData)
  } catch (error) {
    sqlString = `Error: ${(error as Error).message}`
  }

  return (
    <div className="pt-4 border-t">
      <div className="text-xs font-semibold text-muted-foreground mb-1">SQL Condition:</div>
      <CodeMirror
        value={sqlString || 'No filter condition'}
        extensions={[sql()]}
        theme={isDark ? oneDark : undefined}
        editable={false}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
        }}
        style={{
          fontSize: '12px',
          border: '1px solid hsl(var(--border))',
          borderRadius: '6px',
          maxHeight: '50px',
          overflow: 'auto'
        }}
      />
    </div>
  )
}