'use client'

import { Table } from 'lucide-react'
import type { ColumnMeta } from '@/lib/api/queries'
import BasicAGTable from "@/components/common/BasicAGTable";
import IconDialog from '@/components/common/IconDialog'
import { useCardinalityBulk, useRenderType, useIsCategoricalBulk } from '@/lib/hooks'

interface ColumnMetadataDebuggerProps {
  columns: ColumnMeta[]
}

export default function ColumnMetadataDebugger({ columns }: ColumnMetadataDebuggerProps) {
  const { cardinalityColumns } = useCardinalityBulk()
  const renderTypeColumns = useRenderType()
  const { isCategoricalColumns } = useIsCategoricalBulk()
  
  // Transform column metadata for BasicDataTable
  const tableData = columns.map((column) => {
    const cardinalityState = cardinalityColumns[column.column_name]
    const cardinality = cardinalityState?.data
    
    return {
      column_name: column.column_name,
      duckdbType: column.duckdbType,
      
      // Cardinality data
      ...cardinality,
      
      // Preference data
      renderType: renderTypeColumns[column.column_name] || 'text',
      isCategorical: isCategoricalColumns[column.column_name] ?? null,
      
      // Type shortcuts and stats
      ...column.typeShortcuts, 
      ...column.stats
    }
  })

  // Column definition overrides to pin column_name to left
  const colDefOverrides = {
    column_name: { pinned: 'left' as const }
  }

  return (
    <IconDialog
      icon={<Table />}
      title="Column Metadata Debug"
      tooltip="Debug: Show column metadata"
      width="90vw"
      height="90vh"
      buttonClassName="h-6 w-6 p-0"
    >
      <BasicAGTable 
        data={tableData} 
        colDefOverrides={colDefOverrides}
      />
    </IconDialog>
  )
}