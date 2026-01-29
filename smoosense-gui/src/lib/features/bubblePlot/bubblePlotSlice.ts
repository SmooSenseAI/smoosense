import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { isNil } from 'lodash'
import _ from 'lodash'
import { BUBBLE_SIZE_COLOR_VALUE } from './BubblePlotMoreControls'

// BubblePlot data types
export interface BubblePlotDataPoint {
  breakdown: string | null
  bin_x: number
  bin_y: number
  x: number
  y: number
  count: number
  color_value: number | null
}

export interface BubblePlotGroup {
  name: string
  x: number[]
  y: number[]
  customdata: Array<{ condExpr: string; count: number; colorValue: number | null }>
}

export type BubblePlotState = BaseAsyncDataState<BubblePlotGroup[]>

interface FetchBubblePlotParams {
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  bubblePlotBreakdownColumn: string | null // Optional - BubblePlot can work without breakdown column
  bubblePlotColorColumn: string // Optional - column to compute AVG for coloring (empty string = not set)
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
    bubblePlotColorColumn,
    tablePath,
    filterCondition,
    xBin,
    yBin
  } = params
  
  // Use filter condition from parameters
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const additionalWhere = whereClause ? `${whereClause} AND` : 'WHERE'

  // Build query with optional color column
  // Handle special __bubble_size__ value - use COUNT(*) as color value
  const isBubbleSizeColor = bubblePlotColorColumn === BUBBLE_SIZE_COLOR_VALUE
  const colorColumnSelect = (!bubblePlotColorColumn || isBubbleSizeColor)
    ? 'NULL AS color_col'
    : `${sanitizeName(bubblePlotColorColumn)} AS color_col`
  const colorColumnAgg = !bubblePlotColorColumn
    ? 'NULL AS color_value'
    : isBubbleSizeColor
      ? 'COUNT(*) AS color_value'
      : 'AVG(color_col) AS color_value'

  const query = `
    WITH filtered AS (
      SELECT
        ${sanitizeName(bubblePlotXColumn)} AS x,
        ${sanitizeName(bubblePlotYColumn)} AS y,
        ${isNil(bubblePlotBreakdownColumn) ? 'NULL' : sanitizeName(bubblePlotBreakdownColumn)} AS breakdown,
        ${colorColumnSelect}
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
      COUNT(*) AS count,
      ${colorColumnAgg}
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

        return { condExpr, count: item.count, colorValue: item.color_value }
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