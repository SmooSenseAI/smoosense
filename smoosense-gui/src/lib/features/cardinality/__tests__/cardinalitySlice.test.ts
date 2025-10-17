import { configureStore } from '@reduxjs/toolkit'
import cardinalityReducer, {
  setCardinality,
  clearColumnError,
  inferCardinalityFromMetadata,
  type CardinalityState,
  type ColumnCardinality
} from '../cardinalitySlice'
import type { ColumnMeta } from '@/lib/api/queries'

// Create a test store
function createTestStore(preloadedState?: CardinalityState) {
  return configureStore({
    reducer: {
      cardinality: cardinalityReducer
    },
    preloadedState: preloadedState ? { cardinality: preloadedState } : undefined
  })
}

describe('cardinalitySlice', () => {
  it('should have correct initial state', () => {
    const store = createTestStore()
    const state = store.getState().cardinality
    
    expect(state).toEqual({})
  })

  it('should set cardinality from inferred metadata for boolean column', () => {
    const store = createTestStore()
    const columnMeta: ColumnMeta = {
      column_name: 'is_active',
      duckdbType: 'BOOLEAN',
      typeShortcuts: { isInteger: false, isFloat: false, isNumeric: false, isBoolean: true, isString: false, isPrimitive: true, agType: 'boolean', isDatetime: false, isNumericArray: false },
      stats: null
    }

    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      store.dispatch(setCardinality({ columnName: 'is_active', cardinality: inferredCardinality }))
    }
    const state = store.getState().cardinality

    expect(state['is_active'].data).toEqual({
      approxCntD: 2,
      cntD: 2,
      distinctRatio: null,
      cardinality: 'low',
      source: 'from metadata'
    })
    expect(state['is_active'].loading).toBe(false)
    expect(state['is_active'].error).toBeNull()
  })

  it('should set cardinality from inferred metadata for allNull column', () => {
    const store = createTestStore()
    const columnMeta: ColumnMeta = {
      column_name: 'empty_col',
      duckdbType: 'VARCHAR',
      typeShortcuts: { isInteger: false, isFloat: false, isNumeric: false, isBoolean: false, isString: true, isPrimitive: true, agType: 'text', isDatetime: false, isNumericArray: false },
      stats: { min: null, max: null, cntAll: 100, cntNull: 100, hasNull: true, singleValue: false, allNull: true }
    }

    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      store.dispatch(setCardinality({ columnName: 'empty_col', cardinality: inferredCardinality }))
    }
    const state = store.getState().cardinality

    expect(state['empty_col'].data).toEqual({
      approxCntD: 0,
      cntD: 0,
      distinctRatio: 0,
      cardinality: 'low',
      source: 'from metadata'
    })
    expect(state['empty_col'].loading).toBe(false)
    expect(state['empty_col'].error).toBeNull()
  })

  it('should set cardinality from inferred metadata for singleValue column', () => {
    const store = createTestStore()
    const columnMeta: ColumnMeta = {
      column_name: 'constant_col',
      duckdbType: 'VARCHAR',
      typeShortcuts: { isInteger: false, isFloat: false, isNumeric: false, isBoolean: false, isString: true, isPrimitive: true, agType: 'text', isDatetime: false, isNumericArray: false },
      stats: { min: 'constant', max: 'constant', cntAll: 100, cntNull: 0, hasNull: false, singleValue: true, allNull: false }
    }

    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      store.dispatch(setCardinality({ columnName: 'constant_col', cardinality: inferredCardinality }))
    }
    const state = store.getState().cardinality

    expect(state['constant_col'].data).toEqual({
      approxCntD: 1,
      cntD: 1,
      distinctRatio: 0.01,
      cardinality: 'low',
      source: 'from metadata'
    })
    expect(state['constant_col'].loading).toBe(false)
    expect(state['constant_col'].error).toBeNull()
  })

  it('should set cardinality to unknown for non-primitive types', () => {
    const store = createTestStore()
    const columnMeta: ColumnMeta = {
      column_name: 'complex_col',
      duckdbType: 'STRUCT',
      typeShortcuts: { isInteger: false, isFloat: false, isNumeric: false, isBoolean: false, isString: false, isPrimitive: false, agType: 'text', isDatetime: false, isNumericArray: false },
      stats: null
    }

    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      store.dispatch(setCardinality({ columnName: 'complex_col', cardinality: inferredCardinality }))
    }
    const state = store.getState().cardinality

    expect(state['complex_col'].data).toEqual({
      approxCntD: null,
      cntD: null,
      distinctRatio: null,
      cardinality: 'unknown',
      source: 'from metadata'
    })
    expect(state['complex_col'].loading).toBe(false)
    expect(state['complex_col'].error).toBeNull()
  })

  it('should not set cardinality for primitive columns without special stats', () => {
    const store = createTestStore()
    const columnMeta: ColumnMeta = {
      column_name: 'normal_col',
      duckdbType: 'VARCHAR',
      typeShortcuts: { isInteger: false, isFloat: false, isNumeric: false, isBoolean: false, isString: true, isPrimitive: true, agType: 'text', isDatetime: false, isNumericArray: false },
      stats: null
    }

    const inferredCardinality = inferCardinalityFromMetadata(columnMeta)
    if (inferredCardinality) {
      store.dispatch(setCardinality({ columnName: 'normal_col', cardinality: inferredCardinality }))
    }
    const state = store.getState().cardinality

    expect(state['normal_col']).toBeUndefined()
  })

  it('should manually set cardinality', () => {
    const store = createTestStore()
    const cardinality: ColumnCardinality = {
      approxCntD: 500,
      cntD: null,
      distinctRatio: null,
      cardinality: 'high',
      source: 'from query'
    }

    store.dispatch(setCardinality({ columnName: 'test_col', cardinality }))
    const state = store.getState().cardinality

    expect(state['test_col'].data).toEqual(cardinality)
    expect(state['test_col'].loading).toBe(false)
    expect(state['test_col'].error).toBeNull()
  })


  it('should set error cardinality state when query fails to prevent retries', () => {
    const store = createTestStore()
    
    // Simulate a failed query by dispatching the rejected action
    const rejectedAction = {
      type: 'cardinality/queryCardinality/rejected',
      meta: { arg: { columnName: 'failed_col', filePath: '/test/path' } },
      error: { message: 'SQL query failed' }
    }
    
    store.dispatch(rejectedAction as unknown as { type: string; meta: { arg: { columnName: string; filePath: string } }; error: { message: string } })
    const state = store.getState().cardinality

    // Should set error cardinality to prevent retries
    expect(state['failed_col'].data).toEqual({
      approxCntD: null,
      cntD: null,
      distinctRatio: null,
      cardinality: 'unknown',
      source: 'query error'
    })
    
    expect(state['failed_col'].error).toBe('SQL query failed')
    expect(state['failed_col'].loading).toBe(false)
  })

  it('should clear error for a specific column', () => {
    const initialState: CardinalityState = {
      'col1': {
        data: null,
        loading: false,
        error: 'Some error'
      }
    }

    const store = createTestStore(initialState)
    store.dispatch(clearColumnError('col1'))
    const state = store.getState().cardinality

    expect(state['col1'].error).toBeNull()
  })

})