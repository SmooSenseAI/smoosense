import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { isNil } from 'lodash'
import _ from 'lodash'

// BubblePlot data types
export interface BubblePlotDataPoint {
  breakdown: string | null
  bin_x: number
  bin_y: number
  x: number
  y: number
  count: number
}

export interface BubblePlotGroup {
  name: string
  x: number[]
  y: number[]
  customdata: Array<{ condExpr: string; count: number }>
}

export type BubblePlotState = BaseAsyncDataState<BubblePlotGroup[]>

interface FetchBubblePlotParams {
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  bubblePlotBreakdownColumn: string | null // Optional - BubblePlot can work without breakdown column
  tablePath: string
  filterCondition: string | null
  xBin: {
    min: number
    step: number
    round_to: number
  }
  yBin: {
    min: number
    step: number
    round_to: number
  }
}

// BubblePlot fetch function
const fetchBubblePlotFunction = async (
  params: FetchBubblePlotParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<BubblePlotGroup[]> => {
  const { 
    bubblePlotXColumn, 
    bubblePlotYColumn, 
    bubblePlotBreakdownColumn, 
    tablePath, 
    filterCondition,
    xBin,
    yBin
  } = params
  
  // Use filter condition from parameters
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const additionalWhere = whereClause ? `${whereClause} AND` : 'WHERE'

  // Build query
  const query = `
    WITH filtered AS (
      SELECT 
        ${sanitizeName(bubblePlotXColumn)} AS x,
        ${sanitizeName(bubblePlotYColumn)} AS y,
        ${isNil(bubblePlotBreakdownColumn) ? 'NULL' : sanitizeName(bubblePlotBreakdownColumn)} AS breakdown
      FROM '${tablePath}'
      ${additionalWhere} x IS NOT NULL AND y IS NOT NULL
    ), binned AS (
      SELECT
        p.*,
        FLOOR((p.x - ${xBin.min}) / ${xBin.step})::INT AS bin_x,
        FLOOR((p.y - ${yBin.min}) / ${yBin.step})::INT AS bin_y
      FROM filtered AS p
    )
    SELECT breakdown, bin_x, bin_y,
      -- Compute the "bubble" center as the average x and y within that bin
      AVG(x) AS x,
      AVG(y) AS y,
      COUNT(*) AS count
    FROM binned
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3
  `

  const data = await executeQueryAsListOfDict(query, 'bubblePlot', dispatch)

  // Process data into bubble plot groups
  const grouped = _(data as unknown as BubblePlotDataPoint[])
    .groupBy('breakdown')
    .toPairs()
    .map(([breakdown, items]) => {
      const x = _.map(items, 'x')
      const y = _.map(items, 'y')
      const customdata = _.map(items, item => {
        const xMin = item.bin_x * xBin.step + xBin.min
        const xMax = xMin + xBin.step
        const yMin = item.bin_y * yBin.step + yBin.min
        const yMax = yMin + yBin.step
        const xCol = sanitizeName(bubblePlotXColumn)
        const yCol = sanitizeName(bubblePlotYColumn)
        const breakdownCol = sanitizeName(bubblePlotBreakdownColumn)
        
        const condExpr = [
          `${xCol} >= ${xMin}`,
          `${xCol} < ${xMax}`,
          `${yCol} >= ${yMin}`,
          `${yCol} < ${yMax}`,
          ...(isNil(bubblePlotBreakdownColumn) ? [] : [`${breakdownCol} = '${breakdown}'`])
        ].join(' AND ')
        
        return { condExpr, count: item.count }
      })
      return { name: breakdown || 'All', x, y, customdata }
    })
    .value()

  return grouped
}

// Should wait condition
const bubblePlotShouldWait = (params: FetchBubblePlotParams) => {
  return !!(params.bubblePlotXColumn && 
           params.bubblePlotYColumn &&
           params.tablePath && 
           params.xBin &&
           params.yBin)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<BubblePlotGroup[], FetchBubblePlotParams>({
  name: 'bubblePlot',
  fetchFunction: fetchBubblePlotFunction,
  shouldWait: bubblePlotShouldWait,
  errorMessage: 'Failed to fetch bubble plot data'
})

export const bubblePlotSlice = sliceResult.slice
export const fetchBubblePlot = sliceResult.fetchThunk
export const { clearBubblePlot, setBubblePlotError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer