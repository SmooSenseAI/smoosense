# Hook Patterns

Patterns for writing custom hooks in SmooSense.

## Rule: Use `shouldFetch` to collapse complex `useEffect` dependencies

**Problem:** Many guard clauses in `useEffect` with a long dependency array cause the effect to re-run too often and are hard to reason about.

**❌ BAD:**
```typescript
useEffect(() => {
  if (hasData || loading) return
  if (metaLoading || !columnMeta) return
  if (isCategorical === null) return
  if (!filePath) return
  dispatch(queryStats(...))
}, [hasData, loading, metaLoading, columnMeta, isCategorical, filePath, dispatch, columnName])
// 8 dependencies — effect runs on every change
```

**✅ GOOD:**
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
// 3 dependencies — effect only runs when readiness changes
```

---

## Rule: Pass through internal dependencies in hook returns

**Problem:** Nested hooks hide their intermediate data, forcing callers to re-fetch it or duplicate hook calls.

**❌ BAD:**
```typescript
export function useColStats(columnName: string) {
  const { columnMeta, filePath } = useSingleColumnMeta(columnName)
  return { data, loading, error }
  // callers can't access columnMeta without calling the hook again
}
```

**✅ GOOD:**
```typescript
export function useColStats(columnName: string) {
  const { columnMeta, filePath } = useSingleColumnMeta(columnName)
  return { data, loading, error, columnMeta, filePath }
  // callers can compose without duplicating calls
}
```

---

## Rule: Compute and expose a combined `loading` / `error` state

**Problem:** Consumers shouldn't have to manually combine per-source loading/error states.

**✅ GOOD:**
```typescript
export function useComplexData(columnName: string) {
  const { data: meta, loading: metaLoading, error: metaError } = useMeta(columnName)
  const { data: stats, loading: statsLoading, error: statsError } = useStats(columnName)

  const loading = metaLoading || statsLoading
  const error = metaError || statsError

  return { meta, stats, loading, error, metaLoading, statsLoading }
  // consumers get one loading/error; individual states still available
}
```
