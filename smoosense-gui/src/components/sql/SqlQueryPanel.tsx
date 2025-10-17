'use client'

import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setSqlQuery, setSqlResult } from '@/lib/features/ui/uiSlice'
import { executeQuery, generateSqlKey, type RowObject, type QueryResult } from '@/lib/api/queries'
import BasicAGTable from '@/components/common/BasicAGTable'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { Button } from '@/components/ui/button'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import { Play, Loader2 } from 'lucide-react'
import { CLS } from '@/lib/utils/styles'
import { useTheme } from 'next-themes'

export default function SqlQueryPanel() {
  const filePath = useAppSelector((state) => state.ui.filePath)
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  const sqlQuery = useAppSelector((state) => state.ui.sqlQuery)
  const sqlResult = useAppSelector((state) => state.ui.sqlResult)
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Load initial results from Redux store
  useEffect(() => {
    if (sqlResult) {
      setCurrentResult(sqlResult)
    }
  }, [sqlResult])

  // Track elapsed time during query execution
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100) // Update every 100ms for smooth display
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isLoading, startTime])

  // Transform data for BasicAGTable only when needed
  const getTableData = (): RowObject[] => {
    if (!currentResult || currentResult.status !== 'success') {
      return []
    }
    
    return currentResult.rows.map(row => _.zipObject(currentResult.column_names, row)) as RowObject[]
  }

  // Format elapsed time for display
  const formatElapsedTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`
    } else {
      return `${(ms / 1000).toFixed(1)}s`
    }
  }

  // Initialize default query when no query exists and filePath is available
  useEffect(() => {
    if (filePath && !sqlQuery) {
      dispatch(setSqlQuery(`SELECT * FROM '${filePath}' LIMIT 10`))
    }
  }, [filePath, sqlQuery, dispatch])

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) return

    const queryStartTime = Date.now()
    setStartTime(queryStartTime)
    setElapsedTime(0)
    setIsLoading(true)
    // Clear previous results to show loading state
    setCurrentResult(null)
    
    try {
      const sqlKey = generateSqlKey('user_query')
      const result = await executeQuery(sqlQuery, sqlKey, dispatch)
      
      // Save to Redux store
      dispatch(setSqlResult(result))
      
      // Update local state with raw result
      setCurrentResult(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const errorResult: QueryResult = {
        column_names: [],
        rows: [],
        runtime: 0,
        status: 'error',
        error: errorMessage
      }
      
      setCurrentResult(errorResult)
      dispatch(setSqlResult(errorResult))
    } finally {
      setIsLoading(false)
    }
  }

  const sqlEditorPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold">SQL Query</h3>
        <Button
          onClick={handleExecuteQuery}
          disabled={isLoading || !sqlQuery.trim()}
          className={`${CLS.BUTTON_PRIMARY} flex items-center gap-2`}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Run Query
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={sqlQuery}
          onChange={(value) => dispatch(setSqlQuery(value))}
          extensions={[sql()]}
          theme={isDark ? oneDark : undefined}
          height="100%"
          placeholder="Enter your SQL query here..."
          style={{
            height: '100%',
            overflow: 'auto'
          }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            searchKeymap: true,
            autocompletion: true,
            bracketMatching: true,
            dropCursor: false,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  )

  const resultsPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold">Query Results</h3>
        {currentResult && currentResult.status === 'success' && (
          <div className="text-xs text-muted-foreground">
            <span>
              {currentResult.rows.length} rows • {Math.round(currentResult.runtime * 1000)}ms
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div className="text-center">
                <p className="text-sm">Running query...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatElapsedTime(elapsedTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!currentResult && !isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Run a query to see results</p>
          </div>
        )}

        {currentResult && currentResult.status === 'error' && (
          <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5 m-2">
            <h4 className="text-sm font-semibold text-destructive mb-2">Query Error</h4>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap">
              {currentResult.error}
            </pre>
          </div>
        )}

        {currentResult && currentResult.status === 'success' && currentResult.rows.length > 0 && (
          <BasicAGTable data={getTableData()} />
        )}

        {currentResult && currentResult.status === 'success' && currentResult.rows.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Query executed successfully but returned no results</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <ResizablePanels
        direction="vertical"
        defaultSizes={[40, 60]}
        minSize={20}
        maxSize={80}
        className="h-full"
      >
        {sqlEditorPanel}
        {resultsPanel}
      </ResizablePanels>
    </div>
  )
}