# Asset URL Handling

## Query Tab Processing

The Query tab also processes media URLs in query results:

**Location**: `SqlQueryPanel.tsx` @ [SqlQueryPanel.tsx](../smoosense-gui/src/components/sql/SqlQueryPanel.tsx)

**Process**:
1. Execute SQL query via `/api/query` endpoint
2. Receive results as `{column_names, rows}`
3. Transform rows using `_.zipObject(column_names, rows)`
4. **Process media URLs** using same logic as Samples tab:
   - For each cell, check `needToResolveMediaUrl(value)`
   - If true, call `resolveAssetUrl(value, tablePath, baseUrl)`
5. Render in `BasicAGTable` with auto-detected cell renderers
