# Athena Query Engine Support - Migration Checklist

## Completed ✅

### Backend
- [x] Added `awswrangler` dependency
- [x] Created `athena_executor.py` module with query execution and column metadata support
- [x] Updated `/api/query` endpoint to accept `queryEngine` parameter
- [x] Backend routes queries to Athena or DuckDB based on `queryEngine` parameter

### Frontend - Core
- [x] URL parameter `queryEngine` is already captured by `TableUrlParamsProvider`
- [x] `queryEngine` is already in Redux state (`state.ui.queryEngine`)
- [x] Updated `executeQuery`, `executeQueryAsListOfDict`, and `executeQueryAsDictOfList` to accept `queryEngine` parameter
- [x] Updated `getColumnMetadata` to handle Athena table DESCRIBE queries
- [x] Updated `fetchColumnMetadata` thunk to accept and pass `queryEngine`
- [x] Updated `useColumnMeta` hook to pass `queryEngine`
- [x] Updated `SqlQueryPanel` to pass `queryEngine`
- [x] Updated `queryCardinality` thunk and `useCardinality` hook
- [x] Updated `useTotalRows` hook
- [x] Updated `useFileInfo` hook
- [x] Updated `rowDataSlice` to accept `queryEngine` in params

## Remaining Work 🚧

### Frontend - Redux Slices & Hooks

The following files use `executeQueryAsListOfDict` or `executeQueryAsDictOfList` and need to be updated to:
1. Add `queryEngine` to their thunk parameters or get it from Redux state
2. Pass `queryEngine` to the execute functions

**Files to update:**

1. ✅ `/src/lib/features/histogram/histogramSlice.ts`
   - ✅ Updated thunk to accept `queryEngine` parameter
   - ✅ Pass to `executeQueryAsListOfDict` calls
   - ✅ Use conditional table references

2. ✅ `/src/lib/features/heatmap/heatmapSlice.ts`
   - ✅ Updated thunk to accept `queryEngine` parameter
   - ✅ Pass to `executeQueryAsListOfDict` calls
   - ✅ Use conditional table references

3. ✅ `/src/lib/features/colStats/queryBuilders.ts`
   - ✅ Functions now accept `queryEngine` parameter
   - ✅ `buildColStatsQueryFromState` gets queryEngine from Redux state
   - ✅ Use conditional table references in all query builders

4. ✅ `/src/lib/features/bubblePlot/bubblePlotSlice.ts`
   - ✅ Updated thunk to accept `queryEngine` parameter
   - ✅ Pass to `executeQueryAsListOfDict` calls
   - ✅ Use conditional table references

5. ✅ `/src/lib/features/boxplot/boxPlotSlice.ts`
   - ✅ Updated thunk to accept `queryEngine` parameter
   - ✅ Pass to `executeQueryAsListOfDict` calls
   - ✅ Use conditional table references

6. ✅ `/src/lib/features/balanceMap/balanceMapSlice.ts`
   - ✅ Updated thunk to accept `queryEngine` parameter
   - ✅ Pass to `executeQueryAsListOfDict` calls
   - ✅ Use conditional table references

7. `/src/components/folder-browser/previewers/RowTablePreviewer.tsx`
   - Get `queryEngine` from Redux state
   - Pass to `executeQueryAsListOfDict` calls
   - Use conditional table references

8. `/src/components/folder-browser/previewers/ColumnarTablePreviewer.tsx`
   - Get `queryEngine` from Redux state
   - Pass to `executeQueryAsListOfDict` calls
   - Use conditional table references

### Pattern to Follow

For Redux slices with thunks:
```typescript
// Add queryEngine to params interface
interface FetchDataParams {
  // ... existing params
  queryEngine?: 'duckdb' | 'athena' | 'lance'
}

// Update thunk
export const fetchData = createAsyncThunk(
  'feature/fetchData',
  async ({ param1, param2, queryEngine = 'duckdb' }: FetchDataParams, { dispatch }) => {
    // ...
    const result = await executeQueryAsListOfDict(query, sqlKey, dispatch, queryEngine)
    // ...
  }
)
```

For hooks that call thunks:
```typescript
export function useFeature() {
  const queryEngine = useAppSelector((state) => state.ui.queryEngine)
  // ...
  dispatch(fetchData({ param1, param2, queryEngine }))
}
```

For components:
```typescript
const queryEngine = useAppSelector((state) => state.ui.queryEngine)
const result = await executeQueryAsListOfDict(query, sqlKey, dispatch, queryEngine)
```

### Testing Checklist

Once all files are updated:

1. Test with DuckDB (default):
   - `http://localhost:3000/Table?tablePath=/path/to/file.parquet`
   - Verify all features work as before

2. Test with Athena:
   - `http://localhost:3000/Table?tablePath=AwsDataCatalog.default.table_name&queryEngine=athena`
   - Verify:
     - Column metadata loads correctly
     - Table data displays
     - SQL queries execute
     - Filters work
     - Visualizations render

3. Test edge cases:
   - Missing queryEngine (should default to 'duckdb')
   - Invalid queryEngine value (should show error)
   - Athena-specific syntax differences

## Notes

- Athena uses different syntax for table paths: `catalog.database.table` instead of file paths
- Athena DESCRIBE query returns different column names: use `col_name` and `data_type` instead of `column_name` and `column_type`
- Parquet-specific features (metadata, stats) are DuckDB-only
- Some DuckDB functions may not be available in Athena - queries may need adaptation

## Known Limitations for Athena

### Complex Aggregations
The column statistics queries use DuckDB-specific functions that don't have direct Athena equivalents:
- `STRUCT_PACK(a := 1, b := 2)` - DuckDB structured type creation (Athena uses `ROW(1, 2)`)
- `ARRAY_AGG(STRUCT_PACK(...))` - Nested structures in arrays

**Status**: Basic syntax converted (COUNT_IF, :: casting, LOG), but STRUCT_PACK still needs conversion.

**Workaround Options**:
1. Simplify Athena queries to return flat structures
2. Handle STRUCT_PACK conversion in backend query transformation
3. Disable complex column stats for Athena (basic stats only)

## Function Compatibility Issues Fixed

### SQL Function Differences

| Feature | DuckDB | Athena | Status |
|---------|--------|--------|--------|
| Approximate count distinct | `approx_count_distinct()` | `approx_distinct()` | ✅ Fixed in `cardinalitySlice.ts` |
| Random sampling | `random()` | `rand()` | ✅ Fixed in `useRowData.ts` |
| Pagination | `LIMIT ... OFFSET ...` | `LIMIT ...` only | ✅ Fixed in `useRowData.ts` (OFFSET removed) |
| DESCRIBE query | `DESCRIBE SELECT * FROM table` | Via AWS Glue Catalog | ✅ Fixed in `athena_executor.py` |
| Table references | `'path/to/file.parquet'` | `database.table` (no quotes) | ✅ Fixed via query transformation |
| Catalog prefix | N/A | Must be stripped from queries | ✅ Fixed in `transform_query_for_athena()` |
| Conditional counting | `COUNT_IF(condition)` | `SUM(CASE WHEN condition THEN 1 ELSE 0 END)` | ✅ Fixed in `queryBuilders.ts` |
| Type casting | `value::TYPE` | `CAST(value AS TYPE)` | ✅ Fixed in `queryBuilders.ts` |
| Logarithm | `LOG(x)` (base 10) | `LOG10(x)` | ✅ Fixed in `queryBuilders.ts` |
| Struct creation | `STRUCT_PACK(a := 1)` | `ROW(1)` or `CAST(ROW(...) AS ROW(...))` | ⚠️ Partially fixed - needs more work |
| JSON serialization | Native | Pandas NA types | ✅ Fixed in `athena_executor.py` |

### Implementation Details

1. **Table references** (all query-building files):
   - DuckDB: `FROM '${tablePath}'` (with single quotes)
   - Athena: `FROM ${tablePath}` (without quotes)
   - Implemented conditionally based on `queryEngine` parameter
   - Backend `transform_query_for_athena()` handles both quoted and unquoted references

2. **Cardinality queries** (`cardinalitySlice.ts`):
   - Automatically uses `approx_distinct()` for Athena
   - Uses `approx_count_distinct()` for DuckDB

3. **Random sampling** (`useRowData.ts`):
   - Automatically uses `rand()` for Athena
   - Uses `random()` for DuckDB

4. **Pagination** (`useRowData.ts`):
   - Athena: Only `LIMIT` (shows first page only)
   - DuckDB: `LIMIT ... OFFSET ...` (full pagination)

5. **DESCRIBE queries** (`athena_executor.py`):
   - Detects `DESCRIBE database.table` queries
   - Fetches metadata from AWS Glue Catalog instead of executing SQL
   - Returns compatible format with `col_name` and `data_type` columns
