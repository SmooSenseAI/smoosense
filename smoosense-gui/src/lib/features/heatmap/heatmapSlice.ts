import { executeQueryAsListOfDict } from '@/lib/api/queries'
import { createAsyncDataSlice, type BaseAsyncDataState } from '@/lib/utils/createAsyncDataSlice'
import { sanitizeName } from '@/lib/utils/sql/helpers'
import _ from 'lodash'

export const Y_LABEL_VALUE = '__y__label__value__'

// Heatmap data types
export interface HeatmapDataPoint {
  x: string
  y: string
  cnt: number
}

export interface HeatmapRowData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  rowTotal: number
}

export interface HeatmapResult {
  xLabels: string[]
  rowData: HeatmapRowData[]
  xStats: Record<string, { min: number; max: number; sum: number }>
  yStats: Record<string, { min: number; max: number; sum: number }>
  allStats: { min: number; max: number; sum: number }
}

export type HeatmapState = BaseAsyncDataState<HeatmapResult>

interface FetchHeatmapParams {
  heatmapXColumn: string
  heatmapYColumn: string
  tablePath: string
  queryEngine: string
  filterCondition: string | null
}

const computeStats = (data: number[]) => {
  return { min: _.min(data) || 0, max: _.max(data) || 0, sum: _.sum(data) }
}

const pivotData = (data: HeatmapDataPoint[]): HeatmapResult => {
  const xLabels = _(data).map('x').uniq().map(String).value()

  const pivotedData = _(data).groupBy('y').map((rows, y) => {
    const row = _(rows).map(row => [row.x, row]).fromPairs().value()
    return { ...row, [Y_LABEL_VALUE]: y }
  }).value()

  const allStats = computeStats(_.map(data, 'cnt'))

  // Compute max value for each y label
  const yStats = _.fromPairs(_.map(pivotedData, (row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subData = _(row).values().map((item: any) => item?.cnt).filter(val => typeof val === 'number').value()
    return [row[Y_LABEL_VALUE], computeStats(subData)]
  }))

  const xStats = _.fromPairs(_.map(xLabels, (xLabel) => {
    const subData = _.map(pivotedData, (row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = (row as any)[xLabel]
      return item?.cnt
    }).filter(val => typeof val === 'number')
    return [xLabel, computeStats(subData)]
  }))

  const rowData: HeatmapRowData[] = _.map(pivotedData, (row) => {
    return {
      rowTotal: yStats[row[Y_LABEL_VALUE] as string].sum,
      ...row,
    }
  })

  return { xLabels, rowData, xStats, yStats, allStats }
}

const fetchHeatmapFunction = async (
  params: FetchHeatmapParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any
): Promise<HeatmapResult> => {
  const { heatmapXColumn, heatmapYColumn, tablePath, queryEngine, filterCondition } = params
  
  if (!heatmapXColumn || !heatmapYColumn || !tablePath) {
    throw new Error('Missing required parameters for heatmap')
  }

  // Use filter condition from parameters
  const whereClause = filterCondition ? `WHERE ${filterCondition}` : ''
  const additionalWhere = whereClause ? `${whereClause} AND` : 'WHERE'

  // Use lance_table when queryEngine is lance, otherwise use tablePath
  const tableRef = queryEngine === 'lance' ? 'lance_table' : `'${tablePath}'`

  const query = `
WITH filtered AS (
      SELECT
        ${sanitizeName(heatmapXColumn)} AS x,
        ${sanitizeName(heatmapYColumn)} AS y
      FROM ${tableRef}
      ${additionalWhere} x IS NOT NULL AND y IS NOT NULL
  ) SELECT x, y, COUNT(*) AS cnt
   FROM filtered
   GROUP BY x, y
  `

  const data = (await executeQueryAsListOfDict(query, 'heatMap', dispatch, queryEngine, tablePath) as unknown) as HeatmapDataPoint[]

  const heatMap = pivotData(data)
  return heatMap
}

// Should wait condition
const heatmapShouldWait = (params: FetchHeatmapParams) => {
  return !!(params.heatmapXColumn && 
           params.heatmapYColumn &&
           params.tablePath)
}

// Create the slice using the factory
const sliceResult = createAsyncDataSlice<HeatmapResult, FetchHeatmapParams>({
  name: 'heatmap',
  fetchFunction: fetchHeatmapFunction,
  shouldWait: heatmapShouldWait,
  errorMessage: 'Failed to fetch heatmap data'
})

export const heatmapSlice = sliceResult.slice
export const fetchHeatmap = sliceResult.fetchThunk
export const { clearHeatmap, setHeatmapError, setNeedRefresh } = sliceResult.actions
export default heatmapSlice.reducer