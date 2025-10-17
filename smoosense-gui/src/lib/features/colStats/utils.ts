import _ from 'lodash'
import type { HistogramCntValue } from './types'

// Helper function to pad histogram bins to make them continuous
export const padItems = ({ min, step, round_to, cntValues }: {
  min: number
  step: number
  round_to: number
  cntValues: Array<{ binIdx: number; cnt?: number }>
}): HistogramCntValue[] => {
  /**
   * For a given list of cnt and value items, pad the list to make it continuous 0, 1, 2, 3, ...
   */
  const maxBinIdx = _.maxBy(cntValues, 'binIdx')?.binIdx ?? 0
  const itemByIndex = _.fromPairs(_.map(cntValues, item => [item.binIdx, item]))

  return _.range(maxBinIdx + 1).map(i => {
    const binMin = _.round(i * step + min, round_to)
    const binMax = _.round(binMin + step, round_to)
    const binLabel = `[${binMin}, ${binMax})`
    return {
      ...(itemByIndex[i] || {}),
      binIdx: i,
      value: binLabel,
      binMin,
      binMax,
      cnt: itemByIndex[i]?.cnt || 0
    } as HistogramCntValue
  })
}