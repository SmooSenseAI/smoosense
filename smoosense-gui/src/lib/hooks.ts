import { useDispatch, useSelector, useStore } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppStore = useStore

// Re-export custom hooks
export { useColumnMeta, useSingleColumnMeta } from './hooks/useColumnMeta'
export { useRowData } from './hooks/useRowData'
export { useAGGridTheme, useAGGridDefaultColDef, useAGGridOptions } from './hooks/useAGGridTheme'
export { useAg } from './hooks/useAg'
export { useCardinality, useCardinalityBulk } from './hooks/useCardinality'
export { useColBaseStats } from './hooks/useColBaseStats'
export { useColFilteredStats } from './hooks/useColFilteredStats'
export { useRenderType, useSingleColumnRenderType } from './hooks/useRenderType'
export { useIsCategorical, useIsCategoricalBulk } from './hooks/useIsCategorical'
export { useDerivedColumns, useDerivedColumn } from './hooks/useDerivedColumns'
