# Redux Patterns

Critical Redux patterns for SmooSense. Violations cause silent performance bugs (unnecessary re-renders).

## Rule: Use granular selectors — never destructure the slice

**Problem:** Destructuring a slice creates a new object reference on every render, causing all consumers to re-render even when unrelated fields change.

**❌ BAD:**
```typescript
const { fontSize } = useAppSelector((state) => state.ui)
```

**✅ GOOD:**
```typescript
const fontSize = useAppSelector((state) => state.ui.fontSize)
```

---

## Rule: Use `createSelector` when selecting multiple fields together

**Problem:** Multiple individual `useAppSelector` calls create multiple subscriptions and can still cause redundant re-renders if the combined result is used as an object.

**❌ BAD:**
```typescript
const columnMeta = useAppSelector(state => state.columnMeta.data[columnName])
const loading = useAppSelector(state => state.columnMeta.loading)
const error = useAppSelector(state => state.columnMeta.error)
const filePath = useAppSelector(state => state.ui.filePath)
// 4 separate subscriptions
```

**✅ GOOD:**
```typescript
const selectColumnData = createSelector(
  [
    (state: RootState, columnName: string) => state.columnMeta.data[columnName],
    (state: RootState) => state.columnMeta.loading,
    (state: RootState) => state.columnMeta.error,
    (state: RootState) => state.ui.filePath,
  ],
  (columnMeta, loading, error, filePath) => ({ columnMeta, loading, error, filePath })
)

const { columnMeta, loading, error, filePath } = useAppSelector(
  state => selectColumnData(state, columnName)
)
// Single memoized subscription
```

---

## Data slice shape

Every async data slice has exactly 4 fields:

```typescript
{
  data: T | null,
  loading: boolean,
  error: string | null,
  needRefresh: boolean,   // set to true to trigger a refresh
}
```

Use `createAsyncDataSlice` and `useAsyncData` to avoid boilerplate. Per-column slices are keyed by column name.
