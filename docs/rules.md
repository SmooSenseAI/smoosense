# Development Rules and Best Practices

This document contains critical development rules and best practices that must be followed when working on this codebase.

## Redux State Management

### Rule: Use Granular Selectors (Critical Performance Rule)

**Problem:** Object destructuring in `useAppSelector` creates unnecessary re-renders.

**❌ BAD Pattern:**
```typescript
const { fontSize } = useAppSelector((state) => state.ui)
```
- Object destructuring creates a new object reference on every selector call
- Even if only other unused field changes, component re-renders due to new object reference
- Particularly problematic for cell renderers and frequently used components


**✅ GOOD Pattern:**
```typescript
const fontSize = useAppSelector((state) => state.ui.fontSize)
```
Only re-renders when specific field changes


## useEffect Optimization

### Rule: Use shouldFetch Pattern for Complex Dependencies

**Problem:** Multiple dependencies in useEffect can cause unnecessary re-executions and performance issues.

**❌ BAD Pattern:**
```typescript
useEffect(() => {
  // Guard clauses
  if (hasData || loading) return
  if (metaLoading || !columnMeta) return
  if (isCategorical === null) return
  if (!filePath) return
  
  // Make request
  dispatch(queryStats(...))
}, [
  hasData, loading, metaLoading, columnMeta, 
  isCategorical, filePath, dispatch, columnName
  // 8 dependencies - effect runs on any change
])
```

**✅ GOOD Pattern:**
```typescript
const shouldFetch = useMemo(() => {
  return !hasData && !loading && !metaLoading && !!columnMeta && 
         isCategorical !== null && !!filePath
}, [hasData, loading, metaLoading, columnMeta, isCategorical, filePath])

useEffect(() => {
  if (shouldFetch) {
    dispatch(queryStats(...))
  }
}, [shouldFetch, dispatch, columnName])
// Only 3 dependencies - effect runs when shouldFetch changes to true
```

**Benefits:**
- **Fewer effect re-executions**: Only runs when conditions actually change from "not ready" to "ready to fetch"
- **Better performance**: React compares fewer dependencies on each render
- **Clearer logic**: Fetch conditions are explicit and memoized
- **Easier debugging**: Can log `shouldFetch` to understand effect behavior


## Selector Optimization

### Rule: Use createSelector for Multiple Selectors

**Problem:** Multiple individual selectors can cause unnecessary re-renders and duplicate computations.

**❌ BAD Pattern:**
```typescript
const columnMeta = useAppSelector(state => state.columnMeta.data[columnName])
const loading = useAppSelector(state => state.columnMeta.loading)
const error = useAppSelector(state => state.columnMeta.error)
const filePath = useAppSelector(state => state.ui.filePath)
// 4 separate selector subscriptions
```

**✅ GOOD Pattern:**
```typescript
const selectColumnData = createSelector(
  [
    (state: RootState, columnName: string) => state.columnMeta.data[columnName],
    (state: RootState) => state.columnMeta.loading,
    (state: RootState) => state.columnMeta.error,
    (state: RootState) => state.ui.filePath
  ],
  (columnMeta, loading, error, filePath) => ({
    columnMeta,
    loading, 
    error,
    filePath
  })
)

const { columnMeta, loading, error, filePath } = useAppSelector(state => 
  selectColumnData(state, columnName)
)
// Single selector with memoized result
```

**Benefits:**
- **Single subscription**: Only one selector subscription instead of multiple
- **Memoized results**: createSelector memoizes the result object
- **Performance**: Reduces component re-renders when unrelated state changes


## Hook Design Patterns

### Rule: Pass Dependencies in Hook Returns

**Problem:** Nested hooks create coupling and make testing difficult.

**❌ BAD Pattern:**
```typescript
export function useColStats(columnName: string) {
  // Internal dependencies not accessible
  const dispatch = useAppDispatch()
  const columnMeta = useSingleColumnMeta(columnName)
  
  return { data, loading, error }
}
```

**✅ GOOD Pattern:**
```typescript  
export function useColStats(columnName: string) {
  const dispatch = useAppDispatch()
  const { columnMeta, filePath } = useSingleColumnMeta(columnName)
  
  return { 
    data, 
    loading, 
    error,
    // Pass through dependencies for composition
    columnMeta,
    filePath
  }
}
```

**Benefits:**
- **Composability**: Other hooks can reuse dependencies without duplicate calls
- **Testing**: Dependencies are accessible for testing and debugging
- **Transparency**: Clear what data the hook depends on


### Rule: Return Overall Loading and Error States

**Problem:** Individual loading/error states don't reflect the complete picture.

**❌ BAD Pattern:**
```typescript
export function useComplexData(columnName: string) {
  const { data: meta, loading: metaLoading, error: metaError } = useMeta(columnName)
  const { data: stats, loading: statsLoading, error: statsError } = useStats(columnName)
  
  return { 
    meta, metaLoading, metaError,
    stats, statsLoading, statsError
  }
  // Consumer has to manually combine states
}
```

**✅ GOOD Pattern:**
```typescript
export function useComplexData(columnName: string) {
  const { data: meta, loading: metaLoading, error: metaError } = useMeta(columnName)
  const { data: stats, loading: statsLoading, error: statsError } = useStats(columnName)
  
  // Calculate overall states
  const loading = metaLoading || statsLoading
  const error = metaError || statsError
  
  return { 
    meta,
    stats,
    loading,      // Overall loading state
    error,        // Overall error state
    // Individual states available if needed
    metaLoading,
    statsLoading
  }
}
```

**Benefits:**
- **Simplicity**: Consumers get a single loading/error state
- **Accuracy**: Overall states reflect the complete operation status
- **Consistency**: Standard pattern across all complex hooks


---

## Other Development Rules

*Additional rules can be added here as they are established.*