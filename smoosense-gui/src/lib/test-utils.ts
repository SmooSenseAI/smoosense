import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '@/lib/features/ui/uiSlice'
import columnMetaReducer from '@/lib/features/columnMeta/columnMetaSlice'
import sqlHistoryReducer from '@/lib/features/sqlHistory/sqlHistorySlice'
import rowDataReducer from '@/lib/features/rowData/rowDataSlice'
import processedRowDataReducer from '@/lib/features/processedRowData/processedRowDataSlice'
import viewingReducer from '@/lib/features/viewing/viewingSlice'
import agReducer from '@/lib/features/colDefs/agSlice'
import columnsReducer from '@/lib/features/columns/columnsSlice'
import derivedColumnsReducer from '@/lib/features/derivedColumns/derivedColumnsSlice'
import aiQuickActionsReducer from '@/lib/features/aiQuickActions/aiQuickActionsSlice'
import histogramReducer from '@/lib/features/histogram/histogramSlice'
import bubblePlotReducer from '@/lib/features/bubblePlot/bubblePlotSlice'
import balanceMapReducer from '@/lib/features/balanceMap/balanceMapSlice'
import heatmapReducer from '@/lib/features/heatmap/heatmapSlice'
import boxPlotReducer from '@/lib/features/boxplot/boxPlotSlice'
import folderTreeReducer from '@/lib/features/folderTree/folderTreeSlice'
import handPickedRowsReducer from '@/lib/features/handPickedRows/handPickedRowsSlice'
import type { RootState } from '@/lib/store'

// Utility type for deep partial objects
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Creates a default test state with all slices initialized
 */
export function createDefaultTestState(): RootState {
  return {
    ui: {
      fontSize: 14,
      debugMode: false,
      activeTab: 'Table',
      activePlotTab: 'BubblePlot',
      filePath: null,
      rootFolder: '~',
      baseUrl: null,
      sqlQuery: '',
      sqlResult: null,
      rowHeight: 60,
      headerPlotHeight: 48,
      tableCellSpacing: 4,
      histogramNumberOfBins: 50,
      columnForGalleryVisual: '',
      columnForGalleryCaption: '',
      galleryItemWidth: 200,
      galleryItemHeight: 200,
      galleryCaptionHeight: 60,
      cropMediaToFitCover: false,
      galleryVideoMuted: true,
      autoPlayAllVideos: true,
      histogramBreakdownColumn: null,
      histogramColumn: '',
      bubblePlotXColumn: '',
      bubblePlotYColumn: '',
      bubblePlotBreakdownColumn: null,
      bubblePlotMaxMarkerSize: 20,
      bubblePlotOpacity: 0.7,
      bubblePlotMarkerSizeContrastRatio: 0.5,
      heatmapXColumn: null,
      heatmapYColumn: null,
      boxPlotBreakdownColumn: null,
      boxPlotColumns: [],
      boxPlotSortBy: 'avg' as const,
      boxPlotSorting: [],
      fileInfoToShow: 'size' as const,
      showRowDetailsPanel: true,
    },
    columnMeta: {
      data: null,
      loading: false,
      error: null,
    },
    sqlHistory: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      executions: {} as Record<string, any>,
    },
    rowData: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    processedRowData: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    viewing: {
      pageSize: 10,
      pageNumber: 1,
      totalRows: null,
      justClickedRowId: null,
      samplingCondition: null,
    },
    ag: {
      columnDefs: null,
      filters: {},
      sorting: [],
      columnDefsInitialized: false,
    },
    columns: {
      cardinality: {},
      baseStats: {},
      filteredStats: {},
      renderType: {},
      isCategorical: {},
    },
    derivedColumns: {
      columns: [],
      initialized: false,
    },
    aiQuickActions: {
      actions: [],
      initialized: false,
    },
    histogram: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    bubblePlot: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    balanceMap: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    heatmap: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    boxPlot: {
      data: null,
      loading: false,
      error: null,
      needRefresh: false,
    },
    folderTree: {
      rootNode: null,
      expandedPaths: [],
      loading: false,
      error: null,
      viewingId: null,
    },
    handPickedRows: {
      rows: [],
    },
  }
}

/**
 * Creates a test store with optional state overrides
 * @param stateOverrides - Partial state to override defaults
 */
export function createTestStore(stateOverrides?: DeepPartial<RootState>) {
  const defaultState = createDefaultTestState()
  
  // Simple object spread merge for test overrides
  const preloadedState = {
    ...defaultState,
    ...(stateOverrides ? {
      ui: {
        ...defaultState.ui,
        ...(stateOverrides.ui || {}),
      },
      columnMeta: {
        ...defaultState.columnMeta,
        ...(stateOverrides.columnMeta || {}),
      },
      sqlHistory: {
        ...defaultState.sqlHistory,
        ...(stateOverrides.sqlHistory || {}),
      },
      rowData: {
        ...defaultState.rowData,
        ...(stateOverrides.rowData || {}),
      },
      viewing: {
        ...defaultState.viewing,
        ...(stateOverrides.viewing || {}),
      },
      ag: {
        ...defaultState.ag,
        ...(stateOverrides.ag || {}),
      },
      columns: {
        cardinality: {
          ...defaultState.columns.cardinality,
          ...(stateOverrides.columns?.cardinality || {}),
        },
        baseStats: {
          ...defaultState.columns.baseStats,
          ...(stateOverrides.columns?.baseStats || {}),
        },
        renderType: {
          ...defaultState.columns.renderType,
          ...(stateOverrides.columns?.renderType || {}),
        },
        isCategorical: {
          ...defaultState.columns.isCategorical,
          ...(stateOverrides.columns?.isCategorical || {}),
        },
      },
    } : {}),
  } as RootState

  return configureStore({
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
    preloadedState,
  })
}