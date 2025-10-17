import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { isNil } from 'lodash'

// BoxPlot data types - raw data from SQL query
export interface BoxPlotDataPoint {
  breakdown: string | null
  count: number
  [key: string]: unknown // For dynamic column stats (min, max, std, etc.)
}

export type BoxPlotState = BaseAsyncDataState<BoxPlotDataPoint[]>

interface FetchBoxPlotParams {
  boxPlotColumns: string[]
  boxPlotBreakdownColumn: string | null
  filePath: string
  filterCondition: string | null
}

// BoxPlot fetch function
const fetchBoxPlotFunction = async (
  params: FetchBoxPlotParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<BoxPlotDataPoint[]> => {
  const { boxPlotColumns, boxPlotBreakdownColumn, filePath, filterCondition } = params
  
  if (boxPlotColumns.length === 0) {
    return []
  }

  // Helper to generate box plot expressions for a column
  const boxExpr = (c: string) => {
    const e = sanitizeName(c)
    return `{
      'min' : MIN(${e}),
      'max' : MAX(${e}),
      'std' : STDDEV_POP(${e}),
      'skewness': SKEWNESS(${e}),
      'avg' : AVG(${e}),
      'q25' : QUANTILE_CONT(${e}, 0.25),
      'q50' : QUANTILE_CONT(${e}, 0.5),
      'q75' : QUANTILE_CONT(${e}, 0.75)
    } AS ${e}`
  }

  // Build FROM clause
  const fromClause = `FROM '${filePath}'`
  
  // Build WHERE clause
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''

  // Build query
  const query = `
    WITH filtered AS (
      SELECT ${isNil(boxPlotBreakdownColumn) ? 'NULL' : sanitizeName(boxPlotBreakdownColumn)} AS breakdown, 
      ${boxPlotColumns.map(sanitizeName).join(', ')}
      ${fromClause}
      ${whereClause}
    ) SELECT breakdown, COUNT(*) AS count, ${boxPlotColumns.map(c => boxExpr(c)).join(', ')}
    FROM filtered
    GROUP BY breakdown
  `

  const data = await executeQueryAsListOfDict(query, 'boxPlot', dispatch)

  // Return raw data directly without grouping
  return data as unknown as BoxPlotDataPoint[]
}

// Should wait condition
const boxPlotShouldWait = (params: FetchBoxPlotParams) => {
  return !!(params.boxPlotColumns.length > 0 && params.filePath)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<BoxPlotDataPoint[], FetchBoxPlotParams>({
  name: 'boxPlot',
  fetchFunction: fetchBoxPlotFunction,
  shouldWait: boxPlotShouldWait,
  errorMessage: 'Failed to fetch box plot data'
})

export const boxPlotSlice = sliceResult.slice
export const fetchBoxPlot = sliceResult.fetchThunk
export const { clearBoxPlot, setBoxPlotError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer