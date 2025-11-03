import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setTotalRows } from '@/lib/features/viewing/viewingSlice'
import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'

export function useTotalRows(): number | null {
  const dispatch = useAppDispatch()
  const tablePath = useAppSelector((state) => state.ui.tablePath)
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  const totalRows = useAppSelector((state) => state.viewing.totalRows)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))

  useEffect(() => {
    const fetchTotalRows = async () => {
      if (!tablePath || !queryEngine) {
        // Clear total rows if no table path or query engine
        dispatch(setTotalRows(null))
        return
      }

      try {
        // Build COUNT query with filter conditions
        // Use lance_table when queryEngine is lance, otherwise use tablePath
        const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`
        const whereCondition = filterCondition ? ` WHERE ${filterCondition}` : ''
        const countQuery = `SELECT COUNT(*) as total FROM ${tableRef}${whereCondition}`
        const result = await executeQueryAsListOfDict(countQuery, 'totalRows', dispatch, queryEngine, tablePath)
        
        if (result && result.length > 0) {
          const total = Number(result[0].total)
          dispatch(setTotalRows(total))
        }
      } catch (error) {
        console.error('Failed to fetch total rows:', error)
        // Set to null on error
        dispatch(setTotalRows(null))
      }
    }

    // Fetch total rows whenever tablePath, queryEngine, or filter conditions change
    fetchTotalRows()
  }, [tablePath, queryEngine, filterCondition, dispatch])
  
  return totalRows
}