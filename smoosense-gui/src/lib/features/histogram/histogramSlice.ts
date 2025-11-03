import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import { padItems } from '@/lib/features/colStats/utils'
import { isNil } from 'lodash'
import _ from 'lodash'

// Histogram data types
export interface HistogramDataPoint {
  binIdx: number
  cnt: number
}

export interface HistogramGroup {
  name: string
  x: string[]
  y: number[]
  customdata: Array<{ condExpr: string }>
}

export type HistogramState = BaseAsyncDataState<HistogramGroup[]>

interface FetchHistogramParams {
  histogramColumn: string
  histogramBreakdownColumn: string | null
  tablePath: string
  queryEngine: string
  filterCondition: string | null
  histogramStatsData: {
    bin: {
      min: number
      step: number
      round_to: number
    }
  } | null
}

// Histogram fetch function
const fetchHistogramFunction = async (
  params: FetchHistogramParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<HistogramGroup[]> => {
  const { histogramColumn, histogramBreakdownColumn, tablePath, queryEngine, filterCondition, histogramStatsData } = params
  
  if (!histogramStatsData?.bin) {
    throw new Error('Missing histogram bin data')
  }

  const { min, step, round_to } = histogramStatsData.bin
  
  // Use filter condition from parameters
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const additionalWhere = whereClause ? `${whereClause} AND` : 'WHERE'

  // Use lance_table when queryEngine is lance, otherwise use tablePath
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  // Build query
  const query = `
    WITH filtered AS (
      SELECT
        ${sanitizeName(histogramColumn)} AS value,
        ${isNil(histogramBreakdownColumn) ? 'NULL' : sanitizeName(histogramBreakdownColumn)} AS breakdown
      FROM ${tableRef}
      ${additionalWhere} value IS NOT NULL
    )
    SELECT breakdown, FLOOR((value - ${min}) / ${step}) AS binIdx,
        COUNT(*) AS cnt
    FROM filtered
    GROUP BY 1, 2
    ORDER BY 1, 2
  `

  const data = await executeQueryAsListOfDict(query, 'histogram', dispatch, queryEngine, tablePath)

  // Process data into histogram groups
  const grouped = _(data as unknown as HistogramDataPoint[])
    .groupBy('breakdown')
    .toPairs()
    .map(([breakdown, items]) => {
      const paddedItems = padItems({ min, step, round_to, cntValues: items })
      const x = _.map(paddedItems, 'value')
      const y = _.map(paddedItems, 'cnt')
      const customdata = _.map(paddedItems, item => {
        const condCol = [`${sanitizeName(histogramColumn)} >= ${item.binMin}`, `${sanitizeName(histogramColumn)} < ${item.binMax}`]
        const condBreakdown = isNil(histogramBreakdownColumn) ? [] : [`${sanitizeName(histogramBreakdownColumn)} = '${breakdown}'`]
        const condExpr = [...condCol, ...condBreakdown].join(' AND ')
        return { condExpr }
      })
      return { name: breakdown || 'All', x, y, customdata }
    })
    .value()

  return grouped
}

// Should wait condition
const histogramShouldWait = (params: FetchHistogramParams) => {
  return !!(params.histogramColumn && 
           params.tablePath && 
           params.histogramStatsData?.bin)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<HistogramGroup[], FetchHistogramParams>({
  name: 'histogram',
  fetchFunction: fetchHistogramFunction,
  shouldWait: histogramShouldWait,
  errorMessage: 'Failed to fetch histogram data'
})

export const histogramSlice = sliceResult.slice
export const fetchHistogram = sliceResult.fetchThunk
export const { clearHistogram, setHistogramError, setNeedRefresh } = sliceResult.actions
export default sliceResult.reducer