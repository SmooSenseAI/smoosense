'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { TableInfo } from './DBContent'
import LanceColumns from './LanceColumns'
import LanceIndices from './LanceIndices'
import LanceVersions from './LanceVersions'

export default function TablePreview({
  rootFolder,
  tableName,
  tableInfo
}: {
  rootFolder: string
  tableName: string | null
  tableInfo: TableInfo | null | undefined
}) {
  if (!tableName) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a table to view details</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto p-4">
      <Accordion type="single" defaultValue="columns" collapsible className="w-full">
        {/* Columns Section */}
        <AccordionItem value="columns">
          <AccordionTrigger>
            {tableInfo?.cnt_columns !== null && tableInfo?.cnt_columns !== undefined
              ? `${tableInfo.cnt_columns} ${tableInfo.cnt_columns === 1 ? 'column' : 'columns'}`
              : 'Columns'}
          </AccordionTrigger>
          <AccordionContent>
            <LanceColumns rootFolder={rootFolder} tableName={tableName} />
          </AccordionContent>
        </AccordionItem>

        {/* Lance Indices Section */}
        <AccordionItem value="indices">
          <AccordionTrigger>
            {tableInfo?.cnt_indices !== null && tableInfo?.cnt_indices !== undefined
              ? `${tableInfo.cnt_indices} ${tableInfo.cnt_indices === 1 ? 'index' : 'indices'}`
              : 'Lance Indices'}
          </AccordionTrigger>
          <AccordionContent>
            <div className="h-[400px]">
              <LanceIndices rootFolder={rootFolder} tableName={tableName} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Lance Versions Section */}
        <AccordionItem value="versions">
          <AccordionTrigger>
            {tableInfo?.cnt_versions !== null && tableInfo?.cnt_versions !== undefined
              ? `${tableInfo.cnt_versions} ${tableInfo.cnt_versions === 1 ? 'version' : 'versions'}`
              : 'Lance Versions'}
          </AccordionTrigger>
          <AccordionContent>
            <div className="h-[400px]">
              <LanceVersions rootFolder={rootFolder} tableName={tableName} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
