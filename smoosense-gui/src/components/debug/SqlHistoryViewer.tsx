'use client'

import { useAppSelector } from '@/lib/hooks'
import { History } from 'lucide-react'
import BasicAGTable from '@/components/common/BasicAGTable'
import IconDialog from '@/components/common/IconDialog'

export default function SqlHistoryViewer() {
  const executions = useAppSelector((state) => state.sqlHistory.executions)

  // Transform SQL history data for BasicAGTable
  const historyData = Object.entries(executions).map(([sqlKey, execution]) => ({
    sqlKey,
    query: execution.query,
    rows: execution.result.rows,
    status: execution.result.status,
    rowCount: execution.result.rows.length,
    columnCount: execution.result.column_names.length,
    runtime_ms: Math.round(execution.result.runtime * 1000), // Convert to ms
    error: execution.result.error || null,
    timestamp: new Date(execution.timestamp).toLocaleString(),
  }))

  return (
    <IconDialog
      icon={<History />}
      title="SQL Execution History"
      tooltip="Debug: Show SQL execution history"
      width="80vw"
      height="70vh"
    >
      <BasicAGTable data={historyData} />
    </IconDialog>
  )
}