import { FilterType } from '@/lib/features/filters/types'

export interface CategoricalCntValue {
  value: string | number | boolean
  cnt: number
  [key: string]: string | number | boolean | undefined
}

export interface HistogramCntValue {
  value: string
  cnt: number
  binIdx: number
  binMin: number
  binMax: number
  [key: string]: string | number | boolean | undefined
}

// Unified interface for all column statistics
// type mapping: ENUM = categorical, RANGE = histogram, TEXT = text, NONE = null/none
export interface ColumnStats {
  type: FilterType
  /** Histogram bin information, present for histogram stats */
  bin?: {
    count: number
    max: number
    min: number
    round_to: number
    step: number
  }
  /** Range of values in the column */
  range: {
    min: string | number | boolean
    max: string | number | boolean
  }
  /** Count values array, always present (empty for text stats) */
  cnt_values: Array<CategoricalCntValue | HistogramCntValue>
  cnt_all: number
  cnt_null: number
  cnt_not_null: number
}

// Type aliases for backward compatibility and type narrowing
// ENUM = categorical, RANGE = histogram, TEXT = text
export type CategoricalStats = ColumnStats & { 
  type: FilterType.ENUM
  cnt_values: CategoricalCntValue[]
}
export type HistogramStats = ColumnStats & { 
  type: FilterType.RANGE
  bin: NonNullable<ColumnStats['bin']>
  cnt_values: HistogramCntValue[]
}
export type TextStats = ColumnStats & { 
  type: FilterType.TEXT
  cnt_values: []
}

// Per-column state tracking
export interface ColumnStatsState {
  data: ColumnStats | null
  loading: boolean
  error: string | null
  needRefresh: boolean
}

// State shape - direct column name keys
export type ColStatsState = Record<string, ColumnStatsState>
export type ColBaseStatsState = ColStatsState
export type ColFilteredStatsState = ColStatsState