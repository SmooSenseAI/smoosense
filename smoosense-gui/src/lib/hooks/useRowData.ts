import { useAppSelector } from '@/lib/hooks'
import { fetchRowData, setNeedRefresh as setNeedRefreshAction } from '@/lib/features/rowData/rowDataSlice'
import { useAsyncData } from './useAsyncData'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { useMemo } from 'react'

interface UseRowDataResult {
  data: Record<string, unknown>[]
  loading: boolean
  error: string | null
  setNeedRefresh: (needRefresh: boolean) => void
}

export function useRowData(): UseRowDataResult {
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const pageSize = useAppSelector((state) => state.viewing.pageSize)
  const pageNumber = useAppSelector((state) => state.viewing.pageNumber)
  const sorting = useAppSelector((state) => state.ag.sorting)
  const sqlCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  const samplingCondition = useAppSelector((state) => state.viewing.samplingCondition)

  // Build the SQL query
  const query = useMemo(() => {
    if (!tablePath) return null

    // Use lance_table when queryEngine is lance, otherwise use tablePath
    const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

    const offset = (pageNumber - 1) * pageSize

    // Combine SQL condition with sampling condition using AND
    let combinedCondition = ''
    if (sqlCondition && samplingCondition) {
      combinedCondition = ` WHERE (${sqlCondition}) AND (${samplingCondition})`
    } else if (sqlCondition) {
      combinedCondition = ` WHERE ${sqlCondition}`
    } else if (samplingCondition) {
      combinedCondition = ` WHERE ${samplingCondition}`
    }

    // When samplingCondition is not null, use reservoir sampling
    if (samplingCondition !== null) {
      return `SELECT *
    FROM (SELECT * FROM ${tableRef}${combinedCondition})
    ORDER BY random()  --- Changed from reservoir to random. Reservoir does not work for large dataset.
    LIMIT ${pageSize}`
    }

    // Normal query with sorting when samplingCondition is null
    let orderByClause = ''
    if (sorting && sorting.length > 0) {
      const sortClauses = sorting.map(sort => `${sanitizeName(sort.field)} ${sort.direction.toUpperCase()}`)
      orderByClause = ` ORDER BY ${sortClauses.join(', ')}`
    }

    return `SELECT * FROM ${tableRef}${combinedCondition}${orderByClause} LIMIT ${pageSize} OFFSET ${offset}`
  }, [tablePath, queryEngine, pageSize, pageNumber, sqlCondition, samplingCondition, sorting])

  const { data, loading, error, setNeedRefresh } = useAsyncData({
    stateSelector: (state) => state.rowData,
    fetchAction: fetchRowData,
    setNeedRefreshAction: setNeedRefreshAction,
    buildParams: () => {
      if (!query || !tablePath || !queryEngine) return null
      return { query, tablePath, queryEngine }
    },
    dependencies: [query]
  })

  return {
    data: (data || []) as Record<string, unknown>[],
    loading,
    error,
    setNeedRefresh
  }
}