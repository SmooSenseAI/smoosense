import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './features/ui/uiSlice'
import columnMetaReducer from './features/columnMeta/columnMetaSlice'
import sqlHistoryReducer from './features/sqlHistory/sqlHistorySlice'
import rowDataReducer from './features/rowData/rowDataSlice'
import processedRowDataReducer from './features/processedRowData/processedRowDataSlice'
import viewingReducer from './features/viewing/viewingSlice'
import agReducer from './features/colDefs/agSlice'
import columnsReducer from './features/columns/columnsSlice'
import derivedColumnsReducer from './features/derivedColumns/derivedColumnsSlice'
import aiQuickActionsReducer from './features/aiQuickActions/aiQuickActionsSlice'
import histogramReducer from './features/histogram/histogramSlice'
import bubblePlotReducer from './features/bubblePlot/bubblePlotSlice'
import balanceMapReducer from './features/balanceMap/balanceMapSlice'
import heatmapReducer from './features/heatmap/heatmapSlice'
import boxPlotReducer from './features/boxplot/boxPlotSlice'
import folderTreeReducer from './features/folderTree/folderTreeSlice'
import handPickedRowsReducer from './features/handPickedRows/handPickedRowsSlice'

const storeInstance = configureStore({
  reducer: {
    ui: uiReducer,
    columnMeta: columnMetaReducer,
    sqlHistory: sqlHistoryReducer,
    rowData: rowDataReducer,
    processedRowData: processedRowDataReducer,
    viewing: viewingReducer,
    ag: agReducer,
    columns: columnsReducer,
    derivedColumns: derivedColumnsReducer,
    aiQuickActions: aiQuickActionsReducer,
    histogram: histogramReducer,
    bubblePlot: bubblePlotReducer,
    balanceMap: balanceMapReducer,
    heatmap: heatmapReducer,
    boxPlot: boxPlotReducer,
    folderTree: folderTreeReducer,
    handPickedRows: handPickedRowsReducer,
  },
})

export const store = storeInstance
export type RootState = ReturnType<typeof storeInstance.getState>
export type AppDispatch = typeof storeInstance.dispatch