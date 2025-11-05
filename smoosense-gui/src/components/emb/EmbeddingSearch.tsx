'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { fetchEmbeddingSearch, clearEmbeddingSearch } from '@/lib/features/embeddingSearch/embeddingSearchSlice'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function EmbeddingSearch() {
  const dispatch = useAppDispatch()
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const embeddingSearch = useAppSelector((state) => state.embeddingSearch)

  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async () => {
    if (!searchQuery || !tablePath) {
      return
    }

    // Clear previous data before starting new search
    dispatch(clearEmbeddingSearch())
    const { clearRowData } = await import('@/lib/features/rowData/rowDataSlice')
    dispatch(clearRowData())

    // Perform the search
    dispatch(fetchEmbeddingSearch({
      queryText: searchQuery,
      tablePath,
      limit: 10
    }))
  }

  // Save search results to rowData slice when available
  useEffect(() => {
    if (embeddingSearch.data) {
      const searchData = embeddingSearch.data
      // Dynamically import to avoid circular dependencies
      import('@/lib/features/rowData/rowDataSlice').then(({ setRowData }) => {
        dispatch(setRowData(searchData.data))
      })
    }
  }, [embeddingSearch.data, dispatch])

  return (
    <div className="p-4 space-y-4">
      {/* Search Form */}
      {queryEngine === 'lance' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery || embeddingSearch.loading}
            >
              {embeddingSearch.loading ? 'Searching...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {queryEngine !== 'lance' && (
        <div className="text-center text-muted-foreground py-8">
          Embedding search is only available for Lance tables
        </div>
      )}

      {embeddingSearch.loading && (
        <div className="text-center text-muted-foreground py-8">
          Searching...
        </div>
      )}

      {embeddingSearch.error && (
        <div className="text-center text-destructive py-8">
          Error: {embeddingSearch.error}
        </div>
      )}

      {embeddingSearch.data && !embeddingSearch.loading && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Found {embeddingSearch.data.count} results
          </div>
          <div className="space-y-2">
            {embeddingSearch.data.data.map((result, idx) => (
              <div key={idx} className="p-3 bg-background rounded-md border border-border">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
