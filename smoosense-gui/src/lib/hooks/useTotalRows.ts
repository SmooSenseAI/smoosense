import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setTotalRows } from '@/lib/features/viewing/viewingSlice'
import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { extractSqlFilterFromState } from '@/lib/utils/state/filterUtils'

export function useTotalRows(): number | null {
  const dispatch = useAppDispatch()
  const filePath = useAppSelector((state) => state.ui.filePath)
  const totalRows = useAppSelector((state) => state.viewing.totalRows)
  const filterCondition = useAppSelector((state) => extractSqlFilterFromState(state))
  
  useEffect(() => {
    const fetchTotalRows = async () => {
      if (!filePath) {
        // Clear total rows if no file path
        dispatch(setTotalRows(null))
        return
      }
      
      try {
        // Build COUNT query with filter conditions
        const whereCondition = filterCondition ? ` WHERE ${filterCondition}` : ''
        const countQuery = `SELECT COUNT(*) as total FROM '${filePath}'${whereCondition}`
        const result = await executeQueryAsListOfDict(countQuery, 'totalRows', dispatch)
        
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

    // Fetch total rows whenever filePath or filter conditions change
    fetchTotalRows()
  }, [filePath, filterCondition, dispatch])
  
  return totalRows
}