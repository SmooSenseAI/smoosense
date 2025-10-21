import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { executeQuery, generateSqlKey } from '@/lib/api/queries'
import type { ColumnMeta } from '@/lib/api/queries'
import type { AppDispatch } from '@/lib/store'
import { sanitizeName } from '@/lib/utils/sql/helpers'

// Cardinality levels
export type CardinalityLevel = 'high' | 'low' | 'unknown'

// Sources for cardinality determination
export type CardinalitySource = 'from metadata' | 'from query' | 'query timeout' | 'query error'

// Cardinality information for a single column
export interface ColumnCardinality {
  approxCntD: number | null
  cntD: number | null
  distinctRatio: number | null
  cardinality: CardinalityLevel
  source: CardinalitySource
}

// Per-column state tracking
export interface ColumnCardinalityState {
  data: ColumnCardinality | null
  loading: boolean
  error: string | null
}

// State shape - direct column name keys
export type CardinalityState = Record<string, ColumnCardinalityState>

const initialState: CardinalityState = {}

// Helper function to infer cardinality from metadata
export function inferCardinalityFromMetadata(column: ColumnMeta): ColumnCardinality | null {
  // Boolean columns always have cardinality of 2 (or less)
  if (column.duckdbType === 'BOOLEAN') {
    const totalCount = column.stats?.cntAll ?? null
    const distinctRatio = totalCount ? 2 / totalCount : null
    return {
      approxCntD: 2,
      cntD: 2,
      distinctRatio,
      cardinality: 'low',
      source: 'from metadata'
    }
  }

  // Check if all values are null
  if (column.stats?.allNull === true) {
    return {
      approxCntD: 0,
      cntD: 0,
      distinctRatio: 0,
      cardinality: 'low',
      source: 'from metadata'
    }
  }

  // Check if single value
  if (column.stats?.singleValue === true) {
    const totalCount = column.stats?.cntAll ?? null
    const distinctRatio = totalCount ? 1 / totalCount : null
    return {
      approxCntD: 1,
      cntD: 1,
      distinctRatio,
      cardinality: 'low',
      source: 'from metadata'
    }
  }

  // If not a primitive type, set to unknown
  if (!column.typeShortcuts.isPrimitive) {
    return {
      approxCntD: null,
      cntD: null,
      distinctRatio: null,
      cardinality: 'unknown',
      source: 'from metadata'
    }
  }

  // Could not infer from metadata
  return null
}

// Async thunk to query cardinality
export const queryCardinality = createAsyncThunk<
  { columnName: string; cardinality: ColumnCardinality },
  { columnName: string; tablePath: string },
  { dispatch: AppDispatch }
>(
  'cardinality/queryCardinality',
  async ({ columnName, tablePath }, { dispatch }) => {
    const cutoff = 1000
    const sqlQuery = `
      SELECT 
        approx_count_distinct(${sanitizeName(columnName)}) AS approxCntD,
        approxCntD / COUNT(*) AS distinctRatio, 
        CASE
          WHEN approx_count_distinct(${sanitizeName(columnName)}) <= ${cutoff} THEN COUNT(DISTINCT ${sanitizeName(columnName)})
          ELSE NULL
        END AS cntD,
        CASE 
          WHEN approx_count_distinct(${sanitizeName(columnName)}) <= ${cutoff} THEN 'low' 
          ELSE 'high' 
        END AS cardinality
      FROM '${tablePath}' 
      WHERE ${sanitizeName(columnName)} IS NOT NULL
    `.trim()

    // Set up timeout controller
    const controller = new AbortController()
    
    try {
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 5000) // 5 second timeout

      const sqlKey = generateSqlKey(`cardinality_${columnName}`)
      const result = await executeQuery(sqlQuery, sqlKey, dispatch)
      clearTimeout(timeoutId)

      if (controller.signal.aborted) {
        throw new Error('Query timeout')
      }

      if (result.status === 'error') {
        throw new Error(result.error || 'Query failed')
      }

      if (result.rows.length === 0) {
        throw new Error('No results returned')
      }

      const row = result.rows[0]
      const approxCntD = row[0] as number
      const distinctRatio = row[1] as number
      const cntD = row[2] as number | null
      const cardinalityLevel = row[3] as CardinalityLevel

      const cardinalityData = {
        approxCntD,
        cntD,
        distinctRatio,
        cardinality: cardinalityLevel,
        source: 'from query' as CardinalitySource
      }
      
      return {
        columnName,
        cardinality: cardinalityData
      }
    } catch (error) {
      if (controller.signal?.aborted || error instanceof Error && error.message === 'Query timeout') {
        return {
          columnName,
          cardinality: {
            approxCntD: null,
            cntD: null,
            distinctRatio: null,
            cardinality: 'high' as CardinalityLevel,
            source: 'query timeout' as CardinalitySource
          }
        }
      }
      throw error
    }
  }
)

const cardinalitySlice = createSlice({
  name: 'cardinality',
  initialState,
  reducers: {

    // Manually set cardinality for a column
    setCardinality: (state, action: PayloadAction<{ columnName: string; cardinality: ColumnCardinality }>) => {
      const { columnName, cardinality } = action.payload
      state[columnName] = {
        data: cardinality,
        loading: false,
        error: null
      }
    },

    // Clear error for a specific column
    clearColumnError: (state, action: PayloadAction<string>) => {
      const columnName = action.payload
      if (state[columnName]) {
        state[columnName].error = null
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(queryCardinality.pending, (state, action) => {
        const columnName = action.meta.arg.columnName
        if (!state[columnName]) {
          state[columnName] = {
            data: null,
            loading: false,
            error: null
          }
        }
        state[columnName].loading = true
        state[columnName].error = null
      })
      .addCase(queryCardinality.fulfilled, (state, action) => {
        const { columnName, cardinality } = action.payload
        state[columnName] = {
          data: cardinality,
          loading: false,
          error: null
        }
      })
      .addCase(queryCardinality.rejected, (state, action) => {
        const columnName = action.meta.arg.columnName
        
        if (!state[columnName]) {
          state[columnName] = {
            data: null,
            loading: false,
            error: null
          }
        }
        
        // Set a failed cardinality state to prevent retries
        state[columnName] = {
          data: {
            approxCntD: null,
            cntD: null,
            distinctRatio: null,
            cardinality: 'unknown',
            source: 'query error'
          },
          loading: false,
          error: action.error.message || 'Failed to query cardinality'
        }
      })
  }
})

export const {
  setCardinality,
  clearColumnError
} = cardinalitySlice.actions

export default cardinalitySlice.reducer