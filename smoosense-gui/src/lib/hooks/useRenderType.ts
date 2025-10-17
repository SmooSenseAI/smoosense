import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useColumnMeta } from './useColumnMeta'
import { useDerivedColumns } from './useDerivedColumns'
import { initializeRenderTypes } from '@/lib/features/renderType/renderTypeSlice'
import { inferRenderTypeFromData, RenderType } from '@/lib/utils/agGridCellRenderers'
import type { ColumnMeta } from '@/lib/api/queries'
import { isNil, isEmpty, map, fromPairs } from 'lodash'

/**
 * Infer render type for a column using metadata type shortcuts and min/max values as samples
 */
function inferColumnRenderType(columnMeta: ColumnMeta): RenderType {
  // Check if column type is BLOB - treat as Text for rendering
  const duckdbType = columnMeta.duckdbType?.toUpperCase().trim()
  if (duckdbType === 'BLOB') {
    return RenderType.Text
  }

  // Smart initialization based on column type shortcuts
  if (columnMeta.typeShortcuts) {
    const { isBoolean, isNumeric, isDatetime, isPrimitive, isNumericArray } = columnMeta.typeShortcuts

    // Check for bbox columns (numeric array with 'bbox' in column name)
    if (columnMeta.column_name.toLowerCase().includes('bbox') && isNumericArray) {
      return RenderType.Bbox
    }

    // For definitive types, use metadata directly
    if (isBoolean) {
      return RenderType.Boolean
    } else if (isNumeric) {
      return RenderType.Number
    } else if (isDatetime) {
      return RenderType.Date
    } else if (!isPrimitive) {
      return RenderType.Json
    }
    // Continue to enhanced analysis for text/primitive types
  }

  // For text/primitive types, use enhanced analysis with min/max values as samples
  const columnValues: unknown[] = []

  // Add min/max values if available (these are representative extremes)
  if (columnMeta.stats && !isNil(columnMeta.stats.min) && !isNil(columnMeta.stats.max)) {
    const { min, max } = columnMeta.stats
    if (typeof min === 'string') {
      columnValues.push(min)
    }
    if (typeof max === 'string' && max !== min) {
      columnValues.push(max)
    }
  }

  // Use the enhanced data analysis with min/max values
  if (columnValues.length > 0) {
    const inferredType = inferRenderTypeFromData(columnValues, columnMeta.column_name)
    return inferredType
  }

  // Ultimate fallback
  return RenderType.Text
}

/**
 * Hook to get or infer render types for all columns (regular + derived)
 * Regular columns are stored in renderType slice, derived columns in derivedColumns slice
 * 
 * @returns Record<string, RenderType> - Dictionary of render types keyed by column name
 */
export function useRenderType(): Record<string, RenderType> {
  const dispatch = useAppDispatch()
  
  // Get render types for regular columns from Redux
  const regularRenderTypes = useAppSelector((state) => state.columns.renderType)

  const needInit = isEmpty(regularRenderTypes)
  
  // Get column metadata
  const { 
    columns, 
    loading: columnMetaLoading, 
    error: columnMetaError 
  } = useColumnMeta()

  // Get derived columns
  const {
    derivedColumns
  } = useDerivedColumns()

  // Determine if we should initialize render types
  const shouldInit = needInit && 
                     !columnMetaLoading && 
                     !columnMetaError && 
                     columns.length > 0

  // Initialize render types for regular columns only
  useEffect(() => {
    if (shouldInit) {
      // Initialize regular columns only
      const regularColumnRenderTypes = columns.map(columnMeta => {
        const renderType = inferColumnRenderType(columnMeta)
        
        return {
          columnName: columnMeta.column_name,
          renderType
        }
      })
      
      dispatch(initializeRenderTypes(regularColumnRenderTypes))
    }
  }, [shouldInit, dispatch, columns])

  // Combine regular column render types with derived column render types
  const derivedRenderTypes = fromPairs(
    map(derivedColumns, derivedColumn => [derivedColumn.name, derivedColumn.renderType])
  )

  // Return combined render types (regular + derived)
  return {
    ...regularRenderTypes,
    ...derivedRenderTypes
  }
}

/**
 * Hook to get or infer render type for a specific column
 * @param columnName - Name of the column to get render type for
 * @returns RenderType for the specified column, or RenderType.Text as fallback
 */
export function useSingleColumnRenderType(columnName: string): RenderType {
  const renderTypes = useRenderType()
  
  return renderTypes[columnName] || RenderType.Text
}

/**
 * Helper function to get columns by render type
 * @param renderTypes - Dictionary of render types
 * @param targetRenderType - The render type to filter by
 * @returns Array of column names with the specified render type
 */
function getColumnsByRenderType(renderTypes: Record<string, RenderType>, targetRenderType: RenderType): string[] {
  return Object.keys(renderTypes).filter(columnName => renderTypes[columnName] === targetRenderType)
}

/**
 * Hook to get all columns with ImageUrl render type
 * @returns Array of column names that contain image URLs
 */
export function useImageColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.ImageUrl)
}

/**
 * Hook to get all columns with VideoUrl render type
 * @returns Array of column names that contain video URLs
 */
export function useVideoColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.VideoUrl)
}


export function useImageAndVideoColumns(): string[] {
  const renderTypes = useRenderType()
  return [
    ...getColumnsByRenderType(renderTypes, RenderType.ImageUrl),
    ...getColumnsByRenderType(renderTypes, RenderType.VideoUrl)
  ]
}

/**
 * Hook to get all columns with Text render type
 * @returns Array of column names that contain text
 */
export function useTextColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.Text)
}

/**
 * Hook to get all columns with Number render type
 * @returns Array of column names that contain numbers
 */
export function useNumberColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.Number)
}

/**
 * Hook to get all columns with Boolean render type
 * @returns Array of column names that contain booleans
 */
export function useBooleanColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.Boolean)
}

/**
 * Hook to get all columns with IFrame render type
 * @returns Array of column names that contain iframes
 */
export function useIFrameColumns(): string[] {
  const renderTypes = useRenderType()
  return getColumnsByRenderType(renderTypes, RenderType.IFrame)
}

