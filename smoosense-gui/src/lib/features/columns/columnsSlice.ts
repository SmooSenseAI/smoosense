import { combineReducers } from '@reduxjs/toolkit'
import cardinalityReducer from '../cardinality/cardinalitySlice'
import colBaseStatsReducer from '../colStats/colBaseStatsSlice'
import colFilteredStatsReducer from '../colStats/colFilteredStatsSlice'
import renderTypeReducer from '../renderType/renderTypeSlice'
import isCategoricalReducer from '../isCategorical/isCategoricalSlice'

// Combined columns state structure
export interface ColumnsState {
  cardinality: ReturnType<typeof cardinalityReducer>
  baseStats: ReturnType<typeof colBaseStatsReducer>
  filteredStats: ReturnType<typeof colFilteredStatsReducer>
  renderType: ReturnType<typeof renderTypeReducer>
  isCategorical: ReturnType<typeof isCategoricalReducer>
}

// Combine the individual reducers
const columnsReducer = combineReducers({
  cardinality: cardinalityReducer,
  baseStats: colBaseStatsReducer,
  filteredStats: colFilteredStatsReducer,
  renderType: renderTypeReducer,
  isCategorical: isCategoricalReducer
})

export default columnsReducer