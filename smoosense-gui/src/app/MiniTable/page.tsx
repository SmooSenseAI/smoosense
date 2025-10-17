'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/lib/hooks'
import TableUrlParamsProvider from '@/components/providers/TableUrlParamsProvider'
import MiniTableTopBar from '@/components/layout/MiniTableTopBar'
import { AlertCircle } from 'lucide-react'

// Dynamically import MainTable with no SSR to prevent hydration mismatch
const MainTable = dynamic(() => import('@/components/table/MainTable'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading table...</p>
      </div>
    </div>
  )
})

function MiniTablePageInner() {
  const searchParams = useSearchParams()
  const filePath = useAppSelector((state) => state.ui.filePath)
  const urlFilePath = searchParams.get('filePath')

  // Show error if no filePath provided
  if (!urlFilePath && !filePath) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No File Path</h3>
          <p className="text-muted-foreground">
            Please provide a filePath parameter in the URL
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      <MiniTableTopBar />
      <div className="flex-1">
        <MainTable />
      </div>
    </div>
  )
}

export default function MiniTable() {
  return (
    <TableUrlParamsProvider>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
        <MiniTablePageInner />
      </Suspense>
    </TableUrlParamsProvider>
  )
}