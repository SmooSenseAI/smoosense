import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import _ from 'lodash'

// BalanceMap data types
export interface BalanceMapDataPoint {
  bin_x: number
  bin_y: number
  x: number
  y: number
  size: number
  color: Record<string, number> // HISTOGRAM(breakdown) result
}

export interface BalanceMapGroup {
  name: string
  x: number[]
  y: number[]
  customdata: Array<{
    condExpr: string
    count: number
    breakdownHistogram: Record<string, number>
  }>
}

export type BalanceMapState = BaseAsyncDataState<BalanceMapGroup[]>

interface FetchBalanceMapParams {
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  bubblePlotBreakdownColumn: string // Required - BalanceMap needs breakdown column for color mapping
  filePath: string
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

// BalanceMap fetch function
const fetchBalanceMapFunction = async (
  params: FetchBalanceMapParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<BalanceMapGroup[]> => {
  const {
    bubblePlotXColumn,
    bubblePlotYColumn,
    bubblePlotBreakdownColumn,
    filePath,
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
        ${sanitizeName(bubblePlotBreakdownColumn)} AS breakdown
      FROM '${filePath}'
      ${additionalWhere} x IS NOT NULL AND y IS NOT NULL
    ), binned AS (
      SELECT
        p.*,
        FLOOR((p.x - ${xBin.min}) / ${xBin.step})::INT AS bin_x,
        FLOOR((p.y - ${yBin.min}) / ${yBin.step})::INT AS bin_y
      FROM filtered AS p
    )
    SELECT bin_x, bin_y,
      -- Compute the "bubble" center as the average x and y within that bin
      AVG(x) AS x,
      AVG(y) AS y,
      COUNT(*) AS size,
      HISTOGRAM(breakdown) AS color
    FROM binned
    GROUP BY 1, 2
    ORDER BY 1, 2
  `

  const data = await executeQueryAsListOfDict(query, 'balanceMap', dispatch)

  // Process data into a single balance map group (no grouping by breakdown anymore)
  const items = data as unknown as BalanceMapDataPoint[]
  const x = _.map(items, 'x')
  const y = _.map(items, 'y')

  const customdata = _.map(items, item => {
    const xMin = item.bin_x * xBin.step + xBin.min
    const xMax = xMin + xBin.step
    const yMin = item.bin_y * yBin.step + yBin.min
    const yMax = yMin + yBin.step
    const xCol = sanitizeName(bubblePlotXColumn)
    const yCol = sanitizeName(bubblePlotYColumn)

    const condExpr = [
      `${xCol} >= ${xMin}`,
      `${xCol} < ${xMax}`,
      `${yCol} >= ${yMin}`,
      `${yCol} < ${yMax}`
    ].join(' AND ')

    return {
      condExpr,
      count: item.size,
      breakdownHistogram: item.color
    }
  })

  const grouped = [{
    name: 'All',
    x,
    y,
    customdata
  }]

  return grouped
}

// Should wait condition
const balanceMapShouldWait = (params: FetchBalanceMapParams) => {
  return !!(params.bubblePlotXColumn &&
           params.bubblePlotYColumn &&
           params.bubblePlotBreakdownColumn &&
           params.filePath &&
           params.xBin &&
           params.yBin)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<BalanceMapGroup[], FetchBalanceMapParams>({
  name: 'balanceMap',
  fetchFunction: fetchBalanceMapFunction,
  shouldWait: balanceMapShouldWait,
  errorMessage: 'Failed to fetch balance map data'
})

export const balanceMapSlice = sliceResult.slice
export const fetchBalanceMap = sliceResult.fetchThunk
export const { clearBalanceMap, setBalanceMapError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer