# Development Rules and Best Practices

Critical rules that must be followed when working on this codebase. Violations cause silent performance bugs.

## Redux patterns → [patterns/redux.md](patterns/redux.md)

- Use granular selectors — never destructure a slice in `useAppSelector`
- Use `createSelector` when selecting multiple fields together
- Data slice shape: `{ data, loading, error, needRefresh }`

## Hook patterns → [patterns/hooks.md](patterns/hooks.md)

- Use `shouldFetch` (`useMemo`) to collapse complex `useEffect` dependency arrays
- Pass through internal dependencies in hook returns (for composability)
- Always compute and expose a combined `loading` / `error` state

---

*Add new rules to the appropriate `patterns/` file, or create a new one.*