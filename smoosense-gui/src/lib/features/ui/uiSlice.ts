import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { QueryResult } from '@/lib/api/queries'

interface UiState {
  fontSize: number
  debugMode: boolean
  activeTab: string
  activePlotTab: string
  tablePath: string | null
  rootFolder: string | null
  baseUrl: string | null
  queryEngine: 'duckdb' | 'athena' | 'lance'
  sqlQuery: string
  sqlResult: QueryResult | null
  rowHeight: number
  headerPlotHeight: number
  tableCellSpacing: number
  histogramNumberOfBins: number
  columnForGalleryVisual: string
  columnForGalleryCaption: string
  galleryItemWidth: number
  galleryItemHeight: number
  galleryCaptionHeight: number
  cropMediaToFitCover: boolean
  galleryVideoMuted: boolean
  autoPlayAllVideos: boolean
  // showRowDetailsPanel: true means "auto" - RowDetails will show if and only if showRowDetailsPanel is true AND there is justClickedRowId
  showRowDetailsPanel: boolean
  histogramBreakdownColumn: string | null
  histogramColumn: string
  bubblePlotXColumn: string
  bubblePlotYColumn: string
  bubblePlotBreakdownColumn: string | null
  bubblePlotMaxMarkerSize: number
  bubblePlotOpacity: number
  bubblePlotMarkerSizeContrastRatio: number
  heatmapXColumn: string | null
  heatmapYColumn: string | null
  boxPlotBreakdownColumn: string | null
  boxPlotColumns: string[]
  boxPlotSortBy: 'min' | 'max' | 'avg' | 'q50' | 'std' | 'skewness'
  boxPlotSorting: Array<{ field: string; direction: 'asc' | 'desc' }>
  fileInfoToShow: 'size' | 'lastModified' | 'lastModifiedRelative'
}

const initialState: UiState = {
  fontSize: 14,
  debugMode: true,
  activeTab: 'Table',
  activePlotTab: 'BubblePlot',
  tablePath: null,
  rootFolder: null,
  baseUrl: null,
  queryEngine: 'duckdb',
  sqlQuery: '',
  sqlResult: null,
  rowHeight: 80,
  headerPlotHeight: 48,
  tableCellSpacing: 4,
  histogramNumberOfBins: 50,
  columnForGalleryVisual: '',
  columnForGalleryCaption: '',
  galleryItemWidth: 200,
  galleryItemHeight: 200,
  galleryCaptionHeight: 60,
  cropMediaToFitCover: true,
  galleryVideoMuted: true,
  autoPlayAllVideos: true,
  showRowDetailsPanel: true,
  histogramBreakdownColumn: null,
  histogramColumn: '',
  bubblePlotXColumn: '',
  bubblePlotYColumn: '',
  bubblePlotBreakdownColumn: null,
  bubblePlotMaxMarkerSize: 20,
  bubblePlotOpacity: 0.7,
  bubblePlotMarkerSizeContrastRatio: 4.2,
  heatmapXColumn: null,
  heatmapYColumn: null,
  boxPlotBreakdownColumn: null,
  boxPlotColumns: [],
  boxPlotSortBy: 'avg',
  boxPlotSorting: [],
  fileInfoToShow: 'size',
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload
    },
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode
      // Debug mode changed
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload
      // Debug mode changed
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
    },
    setActivePlotTab: (state, action: PayloadAction<string>) => {
      state.activePlotTab = action.payload
    },
    setTablePath: (state, action: PayloadAction<string | null>) => {
      state.tablePath = action.payload
      // Reset SQL query when table path changes
      if (action.payload && action.payload !== state.tablePath) {
        state.sqlQuery = `SELECT * FROM '${action.payload}' LIMIT 10`
        state.sqlResult = null
      }
    },
    setRootFolder: (state, action: PayloadAction<string | null>) => {
      state.rootFolder = action.payload
    },
    setBaseUrl: (state, action: PayloadAction<string | null>) => {
      state.baseUrl = action.payload
    },
    setQueryEngine: (state, action: PayloadAction<'duckdb' | 'athena' | 'lance'>) => {
      state.queryEngine = action.payload
    },
    setSqlQuery: (state, action: PayloadAction<string>) => {
      state.sqlQuery = action.payload
    },
    setSqlResult: (state, action: PayloadAction<QueryResult | null>) => {
      state.sqlResult = action.payload
    },
    setRowHeight: (state, action: PayloadAction<number>) => {
      state.rowHeight = action.payload
    },
    setTableCellSpacing: (state, action: PayloadAction<number>) => {
      state.tableCellSpacing = Math.max(1, Math.min(16, action.payload))
    },
    setHistogramNumberOfBins: (state, action: PayloadAction<number>) => {
      state.histogramNumberOfBins = Math.max(5, Math.min(200, action.payload))
    },
    setHeaderPlotHeight: (state, action: PayloadAction<number>) => {
      state.headerPlotHeight = Math.max(24, Math.min(96, action.payload))
    },
    setColumnForGalleryVisual: (state, action: PayloadAction<string>) => {
      state.columnForGalleryVisual = action.payload
    },
    setColumnForGalleryCaption: (state, action: PayloadAction<string>) => {
      state.columnForGalleryCaption = action.payload
    },
    setGalleryItemWidth: (state, action: PayloadAction<number>) => {
      state.galleryItemWidth = Math.max(100, Math.min(600, action.payload))
    },
    setGalleryItemHeight: (state, action: PayloadAction<number>) => {
      state.galleryItemHeight = Math.max(100, Math.min(600, action.payload))
    },
    setGalleryCaptionHeight: (state, action: PayloadAction<number>) => {
      state.galleryCaptionHeight = Math.max(40, Math.min(200, action.payload))
    },
    setCropMediaToFitCover: (state, action: PayloadAction<boolean>) => {
      state.cropMediaToFitCover = action.payload
    },
    setGalleryVideoMuted: (state, action: PayloadAction<boolean>) => {
      state.galleryVideoMuted = action.payload
    },
    setAutoPlayAllVideos: (state, action: PayloadAction<boolean>) => {
      state.autoPlayAllVideos = action.payload
    },
    setShowRowDetailsPanel: (state, action: PayloadAction<boolean>) => {
      state.showRowDetailsPanel = action.payload
    },
    setHistogramBreakdownColumn: (state, action: PayloadAction<string | null>) => {
      state.histogramBreakdownColumn = action.payload
    },
    setHistogramColumn: (state, action: PayloadAction<string>) => {
      state.histogramColumn = action.payload
    },
    setBubblePlotXColumn: (state, action: PayloadAction<string>) => {
      state.bubblePlotXColumn = action.payload
    },
    setBubblePlotYColumn: (state, action: PayloadAction<string>) => {
      state.bubblePlotYColumn = action.payload
    },
    setBubblePlotBreakdownColumn: (state, action: PayloadAction<string | null>) => {
      state.bubblePlotBreakdownColumn = action.payload
    },
    setBubblePlotMaxMarkerSize: (state, action: PayloadAction<number>) => {
      state.bubblePlotMaxMarkerSize = Math.max(5, Math.min(50, action.payload))
    },
    setBubblePlotOpacity: (state, action: PayloadAction<number>) => {
      state.bubblePlotOpacity = Math.max(0.1, Math.min(1, action.payload))
    },
    setBubblePlotMarkerSizeContrastRatio: (state, action: PayloadAction<number>) => {
      state.bubblePlotMarkerSizeContrastRatio = Math.max(-7, Math.min(7, action.payload))
    },
    setHeatmapXColumn: (state, action: PayloadAction<string | null>) => {
      state.heatmapXColumn = action.payload
    },
    setHeatmapYColumn: (state, action: PayloadAction<string | null>) => {
      state.heatmapYColumn = action.payload
    },
    setBoxPlotBreakdownColumn: (state, action: PayloadAction<string | null>) => {
      state.boxPlotBreakdownColumn = action.payload
    },
    setBoxPlotColumns: (state, action: PayloadAction<string[]>) => {
      state.boxPlotColumns = action.payload
    },
    setBoxPlotSortBy: (state, action: PayloadAction<'min' | 'max' | 'avg' | 'q50' | 'std' | 'skewness'>) => {
      state.boxPlotSortBy = action.payload
    },
    setBoxPlotSorting: (state, action: PayloadAction<Array<{ field: string; direction: 'asc' | 'desc' }>>) => {
      state.boxPlotSorting = action.payload
    },
    setFileInfoToShow: (state, action: PayloadAction<'size' | 'lastModified' | 'lastModifiedRelative'>) => {
      state.fileInfoToShow = action.payload
    },
    setBatchUISettings: (state, action: PayloadAction<Partial<UiState>>) => {
      // Batch update multiple UI settings at once
      Object.entries(action.payload).forEach(([key, value]) => {
        if (key in state && value !== undefined) {
          const typedKey = key as keyof UiState
          // Apply validation rules for specific properties
          if (key === 'tableCellSpacing' && typeof value === 'number') {
            state.tableCellSpacing = Math.max(1, Math.min(16, value))
          } else if (key === 'histogramNumberOfBins' && typeof value === 'number') {
            state.histogramNumberOfBins = Math.max(5, Math.min(200, value))
          } else if (key === 'headerPlotHeight' && typeof value === 'number') {
            state.headerPlotHeight = Math.max(24, Math.min(96, value))
          } else if (key === 'galleryItemWidth' && typeof value === 'number') {
            state.galleryItemWidth = Math.max(100, Math.min(600, value))
          } else if (key === 'galleryItemHeight' && typeof value === 'number') {
            state.galleryItemHeight = Math.max(100, Math.min(600, value))
          } else if (key === 'galleryCaptionHeight' && typeof value === 'number') {
            state.galleryCaptionHeight = Math.max(40, Math.min(200, value))
          } else if (key === 'bubblePlotMaxMarkerSize' && typeof value === 'number') {
            state.bubblePlotMaxMarkerSize = Math.max(5, Math.min(50, value))
          } else if (key === 'bubblePlotOpacity' && typeof value === 'number') {
            state.bubblePlotOpacity = Math.max(0.1, Math.min(1, value))
          } else if (key === 'bubblePlotMarkerSizeContrastRatio' && typeof value === 'number') {
            state.bubblePlotMarkerSizeContrastRatio = Math.max(-7, Math.min(7, value))
          } else {
            // For all other properties, set directly with type assertion
            // This is safe because we've verified the key exists in state
            Object.assign(state, { [typedKey]: value })
          }
        }
      })
    },
  },
})

export const {
  setFontSize,
  toggleDebugMode,
  setDebugMode,
  setActiveTab,
  setActivePlotTab,
  setTablePath,
  setRootFolder,
  setBaseUrl,
  setQueryEngine,
  setSqlQuery,
  setSqlResult,
  setRowHeight,
  setHeaderPlotHeight,
  setTableCellSpacing,
  setHistogramNumberOfBins,
  setColumnForGalleryVisual,
  setColumnForGalleryCaption,
  setGalleryItemWidth,
  setGalleryItemHeight,
  setGalleryCaptionHeight,
  setCropMediaToFitCover,
  setGalleryVideoMuted,
  setAutoPlayAllVideos,
  setShowRowDetailsPanel,
  setHistogramBreakdownColumn,
  setHistogramColumn,
  setBubblePlotXColumn,
  setBubblePlotYColumn,
  setBubblePlotBreakdownColumn,
  setBubblePlotMaxMarkerSize,
  setBubblePlotOpacity,
  setBubblePlotMarkerSizeContrastRatio,
  setHeatmapXColumn,
  setHeatmapYColumn,
  setBoxPlotBreakdownColumn,
  setBoxPlotColumns,
  setBoxPlotSortBy,
  setBoxPlotSorting,
  setFileInfoToShow,
  setBatchUISettings
} = uiSlice.actions
export default uiSlice.reducer