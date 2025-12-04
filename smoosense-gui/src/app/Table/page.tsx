'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/lib/hooks'
import { pathBasename } from '@/lib/utils/pathUtils'
import { useRef, useCallback } from 'react'
import TableNavbar from '@/components/layout/TableNavbar'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import ColumnNavigation from '@/components/table/ColumnNavigation'
import MainTable, { MainTableRef } from '@/components/table/MainTable'
import RowDetails from '@/components/table/RowDetails'
import Gallery from '@/components/gallery/Gallery'
import ColumnFilters from '@/components/filters/ColumnFilters'
import PlotTabContent from '@/components/layout/PlotTabContent'
import EmbeddingTabContent from '@/components/layout/EmbeddingTabContent'
import Summary from '@/components/Summary'
import SqlQueryPanel from '@/components/sql/SqlQueryPanel'
import HandPickedRowsTable from '@/components/handpick/HandPickedRowsTable'
import TableUrlParamsProvider from '@/components/providers/TableUrlParamsProvider'

const getActiveContent = (activeTab: string) => {
  return activeTab
}

function TablePageInner() {
  const searchParams = useSearchParams()
  const activeTab = useAppSelector((state) => state.ui.activeTab)
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const showRowDetailsPanel = useAppSelector((state) => state.ui.showRowDetailsPanel)
  const urlTablePath = searchParams.get('tablePath')

  // Show row details panel only if both conditions are met
  const shouldShowRowDetailsPanel = showRowDetailsPanel
  const mainTableRef = useRef<MainTableRef>(null)
  
  const handleColumnClick = useCallback((columnName: string) => {
    mainTableRef.current?.scrollToColumn(columnName)
  }, [])

  // Set document title based on tablePath
  useEffect(() => {
    const currentPath = tablePath || urlTablePath
    if (currentPath) {
      const fileName = pathBasename(currentPath)
      document.title = fileName ? `${fileName} - SmooSense` : 'SmooSense'
    } else {
      document.title = 'SmooSense'
    }
  }, [tablePath, urlTablePath])

  // If both tablePath and urlTablePath are nil, show error
  if (!tablePath && !urlTablePath) {
    return (
      <div className="min-h-screen bg-background">
        <TableNavbar />
        <main className="container mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <h1 className="text-4xl font-bold text-destructive mb-4">
              Error: Missing File Path
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-md">
              This page requires a <code className="bg-muted px-2 py-1 rounded">tablePath</code> parameter in the URL.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Example: <code className="bg-muted px-2 py-1 rounded">/Table?tablePath=/path/to/file.csv</code>
            </p>
          </div>
        </main>
      </div>
    )
  }

  // If tablePath is nil but urlTablePath exists, show loading spinner
  if (!tablePath && urlTablePath) {
    return (
      <div className="min-h-screen bg-background">
        <TableNavbar />
        <main className="container mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-muted-foreground">Loading...</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Processing file path: <code className="bg-muted px-2 py-1 rounded">{urlTablePath}</code>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TableNavbar />
      <main className="h-[calc(100vh-96px)]">
        {activeTab === 'Table' ? (
          <div className="h-full w-full">
            {shouldShowRowDetailsPanel ? (
              <ResizablePanels
                key="table-3-panels"
                direction="horizontal"
                defaultSizes={[12, 63, 25]}
              >
                <div className="h-full bg-background overflow-hidden">
                  <ColumnNavigation onColumnClick={handleColumnClick} />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <MainTable ref={mainTableRef} />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <RowDetails />
                </div>
              </ResizablePanels>
            ) : (
              <ResizablePanels
                key="table-2-panels"
                direction="horizontal"
                defaultSizes={[12, 88]}
              >
                <div className="h-full bg-background overflow-hidden">
                  <ColumnNavigation onColumnClick={handleColumnClick} />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <MainTable ref={mainTableRef} />
                </div>
              </ResizablePanels>
            )}
          </div>
        ) : activeTab === 'Gallery' ? (
          <div className="h-full w-full">
            {shouldShowRowDetailsPanel ? (
              <ResizablePanels
                key="gallery-3-panels"
                direction="horizontal"
                defaultSizes={[12, 63, 25]}
              >
                <div className="h-full bg-background overflow-hidden">
                  <ColumnFilters />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <Gallery />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <RowDetails />
                </div>
              </ResizablePanels>
            ) : (
              <ResizablePanels
                key="gallery-2-panels"
                direction="horizontal"
                defaultSizes={[12, 88]}
              >
                <div className="h-full bg-background overflow-hidden">
                  <ColumnFilters />
                </div>
                <div className="h-full bg-background overflow-hidden">
                  <Gallery />
                </div>
              </ResizablePanels>
            )}
          </div>
        ) : activeTab === 'Summarize' ? (
          <Summary />
        ) : activeTab === 'Query' ? (
          <div className="h-full">
            <SqlQueryPanel />
          </div>
        ) : activeTab === 'Plot' ? (
          <PlotTabContent />
        ) : activeTab === 'Embedding' ? (
          <EmbeddingTabContent />
        ) : activeTab === 'HandPick' ? (
          <div className="h-full">
            <HandPickedRowsTable />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full px-4">
            <h1 className="text-4xl font-bold text-foreground">
              {getActiveContent(activeTab)}
            </h1>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Table() {
  return (
    <TableUrlParamsProvider>
      <TablePageInner />
    </TableUrlParamsProvider>
  )
}