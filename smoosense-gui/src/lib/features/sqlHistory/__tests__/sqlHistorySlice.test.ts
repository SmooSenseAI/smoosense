import sqlHistoryReducer, {
  addExecution,
  clearHistory,
  removeExecution
} from '../sqlHistorySlice'
import type { QueryResult } from '@/lib/api/queries'

describe('sqlHistorySlice', () => {
  const initialState = {
    executions: {}
  }

  const mockResult: QueryResult = {
    column_names: ['id', 'name'],
    rows: [['1', 'John'], ['2', 'Jane']],
    runtime: 0.5,
    status: 'success'
  }

  const mockQuery = 'SELECT id, name FROM users'

  it('should return the initial state', () => {
    expect(sqlHistoryReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle addExecution', () => {
    const actual = sqlHistoryReducer(initialState, addExecution({ sqlKey: 'test_123', query: mockQuery, result: mockResult }))
    expect(Object.keys(actual.executions)).toHaveLength(1)
    expect(actual.executions['test_123'].query).toEqual(mockQuery)
    expect(actual.executions['test_123'].result).toEqual(mockResult)
    expect(actual.executions['test_123'].timestamp).toBeDefined()
  })

  it('should add multiple executions', () => {
    const stateWithOneExecution = {
      executions: { 
        'test_123': { 
          query: mockQuery, 
          result: mockResult, 
          timestamp: '2023-01-01T00:00:00.000Z' 
        } 
      }
    }

    const newResult: QueryResult = {
      column_names: ['user_id', 'email'],
      rows: [['1', 'john@example.com']],
      runtime: 0.3,
      status: 'success'
    }

    const newQuery = 'SELECT user_id, email FROM users'

    const actual = sqlHistoryReducer(stateWithOneExecution, addExecution({ sqlKey: 'test_456', query: newQuery, result: newResult }))
    expect(Object.keys(actual.executions)).toHaveLength(2)
    expect(actual.executions['test_123'].query).toEqual(mockQuery)
    expect(actual.executions['test_123'].result).toEqual(mockResult)
    expect(actual.executions['test_456'].query).toEqual(newQuery)
    expect(actual.executions['test_456'].result).toEqual(newResult)
  })

  it('should overwrite execution with same sqlKey', () => {
    const stateWithExecution = {
      executions: { 
        'test_123': { 
          query: mockQuery, 
          result: mockResult, 
          timestamp: '2023-01-01T00:00:00.000Z' 
        } 
      }
    }

    const newResult: QueryResult = {
      column_names: ['updated'],
      rows: [['new data']],
      runtime: 1.0,
      status: 'success'
    }

    const newQuery = 'SELECT * FROM updated_table'

    const actual = sqlHistoryReducer(stateWithExecution, addExecution({ sqlKey: 'test_123', query: newQuery, result: newResult }))
    expect(Object.keys(actual.executions)).toHaveLength(1)
    expect(actual.executions['test_123'].query).toEqual(newQuery)
    expect(actual.executions['test_123'].result).toEqual(newResult)
    expect(actual.executions['test_123'].timestamp).toBeDefined()
  })

  it('should handle clearHistory', () => {
    const stateWithHistory = {
      executions: { 
        'test_123': { 
          query: mockQuery, 
          result: mockResult, 
          timestamp: '2023-01-01T00:00:00.000Z' 
        } 
      }
    }

    const actual = sqlHistoryReducer(stateWithHistory, clearHistory())
    expect(Object.keys(actual.executions)).toHaveLength(0)
  })

  it('should handle removeExecution', () => {
    const anotherResult: QueryResult = {
      column_names: ['id'],
      rows: [['456']],
      runtime: 0.2,
      status: 'success'
    }

    const anotherQuery = 'SELECT id FROM other_table'

    const stateWithMultipleExecutions = {
      executions: {
        'test_123': { 
          query: mockQuery, 
          result: mockResult, 
          timestamp: '2023-01-01T00:00:00.000Z' 
        },
        'test_456': { 
          query: anotherQuery, 
          result: anotherResult, 
          timestamp: '2023-01-01T01:00:00.000Z' 
        }
      }
    }

    const actual = sqlHistoryReducer(stateWithMultipleExecutions, removeExecution('test_123'))
    expect(Object.keys(actual.executions)).toHaveLength(1)
    expect(actual.executions['test_456'].query).toEqual(anotherQuery)
    expect(actual.executions['test_456'].result).toEqual(anotherResult)
    expect(actual.executions['test_123']).toBeUndefined()
  })

  it('should handle error executions', () => {
    const errorResult: QueryResult = {
      column_names: [],
      rows: [],
      runtime: 0.1,
      status: 'error',
      error: 'Table not found'
    }

    const errorQuery = 'SELECT * FROM nonexistent_table'

    const actual = sqlHistoryReducer(initialState, addExecution({ sqlKey: 'error_test', query: errorQuery, result: errorResult }))
    expect(actual.executions['error_test'].query).toEqual(errorQuery)
    expect(actual.executions['error_test'].result).toEqual(errorResult)
    expect(actual.executions['error_test'].timestamp).toBeDefined()
  })
})