import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  setActiveTab,
  setActivePlotTab,
  setBubblePlotXColumn,
  setBubblePlotYColumn,
  setBubblePlotBreakdownColumn,
  setBubblePlotMarkerSizeContrastRatio,
  setColumnForGalleryCaption,
  setColumnForGalleryVisual,
  setBoxPlotBreakdownColumn,
  setBoxPlotColumns,
  setBoxPlotSortBy,
  setBoxPlotSorting
} from '@/lib/features/ui/uiSlice'
import { onlyShowColumns, setSorting } from '@/lib/features/colDefs/agSlice'

interface ReduxAction {
  type: string
  payload?: unknown
}

export interface AIQuickAction {
  name: string
  confirmation: string
  actions: ReduxAction[]
}

interface AIQuickActionsState {
  actions: AIQuickAction[]
  initialized: boolean
}

const initialState: AIQuickActionsState = {
  actions: [],
  initialized: false
}

/**
 * Generate AI quick actions based on file name patterns
 * This logic can be enhanced by AI in the future
 */
export function generateQuickActions(fileName: string): AIQuickAction[] {
  const quickActions: AIQuickAction[] = []
  
  // Extract filename without path
  const baseFileName = fileName.split('/').pop()?.toLowerCase() || ''
  
  // Pattern: bbox.parquet -> bounding box visualization actions
  if (baseFileName === 'bbox.parquet') {
    quickActions.push({
      name: 'Abnormally small bbox',
      confirmation: `Great! I've switched to Table view. 
      Only related columns are shown, sorted by smallest bbox area.
      You can see more details in the interactive GUI. 
      `,
      actions: [
        { type: setActiveTab.type, payload: 'Table' },
        { type: onlyShowColumns.type, payload: ['bbox_area', 'bbox', 'image_url', 'category_name', 'bbox_width', 'bbox_height'] },
        { type: setSorting.type, payload: [{ field: 'bbox_area', direction: 'asc' }] }
      ]
    }, {
      name: 'Show bounding boxes with uncommon width-height ratio.',
      confirmation: 'You can analyze it in Bubble Plot with width vs height. Drag-select interesting areas to see samples.',
      actions: [
        { type: setActiveTab.type, payload: 'Plot' },
        { type: setActivePlotTab.type, payload: 'BubblePlot' },
        { type: setBubblePlotXColumn.type, payload: 'bbox_width' },
        { type: setBubblePlotYColumn.type, payload: 'bbox_height' },
        { type: setColumnForGalleryCaption.type, payload: 'category_name' },
        { type: setColumnForGalleryVisual.type, payload: 'bbox' }
      ]
    }, {
      name: 'Which category has big variation in bounding box sizes?',
      confirmation: 'Box Plot is perfect for this purpose. You can click on a boxplot cell and see samples.',
      actions: [
        { type: setActiveTab.type, payload: 'Plot' },
        { type: setActivePlotTab.type, payload: 'BoxPlot' },
        { type: setBoxPlotBreakdownColumn.type, payload: 'category_name' },
        { type: setBoxPlotSortBy.type, payload: 'std' },
        { type: setBoxPlotColumns.type, payload: ['bbox_area', 'bbox_percentage'] },
        { type: setBoxPlotSorting.type, payload: [{ field: 'bbox_percentage', direction: 'desc' }] },
        { type: setColumnForGalleryCaption.type, payload: 'category_name' },
        { type: setColumnForGalleryVisual.type, payload: 'bbox' }
      ]
    })
  } else if (baseFileName === 'images-emb-2d.parquet') {
    quickActions.push({
      name: 'Use embedding to check if training/validation/testing are balanced',
      confirmation: `
Happy to help. In the table I see column \`fold\` and pre-computed embedding columns.
Here is the overall distribution:

<HeaderStatsCellRendererImpl columnname="fold" side="bottom"></HeaderStatsCellRendererImpl>
  
I used BalanceMap to create a bubble plot: images are clustered by semantic similarity and color-coded by local relative ratios.

- A neutral color indicates balance
- Deeper colors highlight imbalance.
 
You can click any bubble to explore the samples in that region.
`,
      actions: [
        { type: setActiveTab.type, payload: 'Plot' },
        { type: setActivePlotTab.type, payload: 'BalanceMap' },
        { type: setBubblePlotBreakdownColumn.type, payload: 'fold' },
        { type: setBubblePlotMarkerSizeContrastRatio.type, payload: 2 },
        { type: setBubblePlotXColumn.type, payload: 'emb_x' },
        { type: setBubblePlotYColumn.type, payload: 'emb_y' },
        { type: setColumnForGalleryCaption.type, payload: 'fold' },
        { type: setColumnForGalleryVisual.type, payload: 'coco_url' }
      ]
    })
  }
  
  // Future patterns can be added here:
  // - sales.csv -> sales analysis actions
  // - user_behavior.parquet -> user journey actions
  // - model_metrics.json -> model performance actions
  
  return quickActions
}

const aiQuickActionsSlice = createSlice({
  name: 'aiQuickActions',
  initialState,
  reducers: {
    initializeQuickActions: (state, action: PayloadAction<{ fileName: string }>) => {
      const { fileName } = action.payload
      const quickActions = generateQuickActions(fileName)
      
      state.actions = quickActions
      state.initialized = true
    },
    
    addQuickAction: (state, action: PayloadAction<AIQuickAction>) => {
      const existingIndex = state.actions.findIndex(item => item.name === action.payload.name)
      if (existingIndex !== -1) {
        state.actions[existingIndex] = action.payload
      } else {
        state.actions.push(action.payload)
      }
    },
    
    removeQuickAction: (state, action: PayloadAction<string>) => {
      state.actions = state.actions.filter(item => item.name !== action.payload)
    },
    
    reset: (state) => {
      state.actions = []
      state.initialized = false
    }
  }
})

export const {
  initializeQuickActions,
  addQuickAction,
  removeQuickAction,
  reset
} = aiQuickActionsSlice.actions

export default aiQuickActionsSlice.reducer
export type { ReduxAction, AIQuickActionsState }