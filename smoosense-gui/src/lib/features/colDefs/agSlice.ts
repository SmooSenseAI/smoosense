import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ColumnMeta } from '@/lib/api/queries'
import { FilterType } from '@/lib/features/filters/types'
import type { DerivedColumn } from '@/lib/features/derivedColumns/derivedColumnsSlice'

// Store minimal column definition without renderer
interface BaseColDef {
  field: string
  headerName: string
  width: number
  pinned: 'left' | null
  hide: boolean
}

type NullFilterOption = 'Include' | 'Exclude' | 'Only Null' | 'N/A'

interface ColumnFilter {
  null: NullFilterOption
  filterType: FilterType
  including?: string[] // Enum filter property
  range?: number[] // Range filter properties
  contains?: string // Text filter properties
}

interface AgState {
  columnDefs: BaseColDef[] | null
  filters: Record<string, ColumnFilter | undefined>
  sorting: Array<{ field: string; direction: 'asc' | 'desc' }>
  columnDefsInitialized: boolean
}

const initialState: AgState = {
  columnDefs: null,
  filters: {},
  sorting: [],
  columnDefsInitialized: false
}

const agSlice = createSlice({
  name: 'ag',
  initialState,
  reducers: {
    initializeFromColumnMetadata: (state, action: PayloadAction<{ 
      columns: ColumnMeta[]
      derivedColumns?: DerivedColumn[]
    }>) => {
      const { columns, derivedColumns = [] } = action.payload
      
      // Create minimal column definitions from regular columns
      const regularColumnDefs: BaseColDef[] = columns.map(col => ({
        field: col.column_name,
        headerName: col.column_name,
        width: 150, // Default width - will be updated based on renderType from columnPreferences
        pinned: null, // Default not pinned
        hide: false // Default visible
      }))
      
      // Create column definitions from derived columns
      const derivedColumnDefs: BaseColDef[] = derivedColumns.map(col => ({
        field: col.name,
        headerName: col.name,
        width: 150,
        pinned: 'left',
        hide: false // Default visible
      }))
      
      // Combine regular and derived column definitions
      state.columnDefs = [...regularColumnDefs, ...derivedColumnDefs]
      state.columnDefsInitialized = true
    },
    
    updateColumnDef: (state, action: PayloadAction<{ 
      field: string
      updates: Partial<BaseColDef> 
    }>) => {
      if (!state.columnDefs) return
      
      const { field, updates } = action.payload
      const columnIndex = state.columnDefs.findIndex(col => col.field === field)
      
      if (columnIndex !== -1) {
        state.columnDefs[columnIndex] = {
          ...state.columnDefs[columnIndex],
          ...updates
        }
      }
    },
    
    updateMultipleColumnDefs: (state, action: PayloadAction<Array<{ 
      field: string
      updates: Partial<BaseColDef> 
    }>>) => {
      if (!state.columnDefs) return
      
      action.payload.forEach(({ field, updates }) => {
        const columnIndex = state.columnDefs!.findIndex(col => col.field === field)
        if (columnIndex !== -1) {
          state.columnDefs![columnIndex] = {
            ...state.columnDefs![columnIndex],
            ...updates
          }
        }
      })
    },
    
    reorderColumns: (state, action: PayloadAction<string[]>) => {
      if (!state.columnDefs) return
      
      const newOrder = action.payload
      const reorderedColumnDefs: BaseColDef[] = []
      
      // Reorder based on the provided field names
      newOrder.forEach(field => {
        const columnDef = state.columnDefs!.find(col => col.field === field)
        if (columnDef) {
          reorderedColumnDefs.push(columnDef)
        }
      })
      
      // Add any columns that weren't in the newOrder (shouldn't happen, but safety)
      state.columnDefs.forEach(col => {
        if (!newOrder.includes(col.field)) {
          reorderedColumnDefs.push(col)
        }
      })
      
      state.columnDefs = reorderedColumnDefs
    },
    
    updateColumnWidth: (state, action: PayloadAction<{ field: string; width: number }>) => {
      if (!state.columnDefs) return
      
      const { field, width } = action.payload
      const columnIndex = state.columnDefs.findIndex(col => col.field === field)
      
      if (columnIndex !== -1) {
        state.columnDefs[columnIndex].width = width
      }
    },
    
    toggleColumnVisibility: (state, action: PayloadAction<string>) => {
      if (!state.columnDefs) return
      
      const field = action.payload
      const columnIndex = state.columnDefs.findIndex(col => col.field === field)
      
      if (columnIndex !== -1) {
        state.columnDefs[columnIndex].hide = !state.columnDefs[columnIndex].hide
      }
    },
    
    toggleColumnPin: (state, action: PayloadAction<string>) => {
      if (!state.columnDefs) return
      
      const field = action.payload
      const columnIndex = state.columnDefs.findIndex(col => col.field === field)
      
      if (columnIndex !== -1) {
        const currentPin = state.columnDefs[columnIndex].pinned
        state.columnDefs[columnIndex].pinned = currentPin === 'left' ? null : 'left'
      }
    },
    
    setColumnFilter: (state, action: PayloadAction<{
      columnName: string
      filter: ColumnFilter | undefined
    }>) => {
      const { columnName, filter } = action.payload
      if (filter === undefined) {
        delete state.filters[columnName]
      } else {
        state.filters[columnName] = filter
      }
    },
    
    setSorting: (state, action: PayloadAction<Array<{ field: string; direction: 'asc' | 'desc' }>>) => {
      state.sorting = action.payload
    },
    
    onlyShowColumns: (state, action: PayloadAction<string[]>) => {
      if (!state.columnDefs) return
      
      const columnsToShow = action.payload
      const reorderedAndFiltered: BaseColDef[] = []
      
      // First, add columns in the order specified in the list (visible)
      columnsToShow.forEach(columnName => {
        const columnDef = state.columnDefs!.find(col => col.field === columnName)
        if (columnDef) {
          reorderedAndFiltered.push({
            ...columnDef,
            hide: false // Show this column
          })
        }
      })
      
      // Then, add remaining columns (hidden)
      state.columnDefs.forEach(col => {
        if (!columnsToShow.includes(col.field)) {
          reorderedAndFiltered.push({
            ...col,
            hide: true // Hide this column
          })
        }
      })
      
      state.columnDefs = reorderedAndFiltered
    },
    
    reset: (state) => {
      state.columnDefs = null
      state.filters = {}
      state.sorting = []
      state.columnDefsInitialized = false
    }
  }
})

export const {
  initializeFromColumnMetadata,
  updateColumnDef,
  updateMultipleColumnDefs,
  reorderColumns,
  updateColumnWidth,
  toggleColumnVisibility,
  toggleColumnPin,
  setColumnFilter,
  setSorting,
  onlyShowColumns,
  reset
} = agSlice.actions

export default agSlice.reducer
export type { AgState, BaseColDef, ColumnFilter, NullFilterOption }