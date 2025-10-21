# Claude Code Development Notes

This file contains development notes and reminders for Claude when working on this project.

## Project Overview
- **Framework**: Next.js 15 with TypeScript, App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Redux Toolkit
- **Package Manager**: pnpm
- **Backend**: Python Flask (runs on port 8000 in development)

## Key Commands
```bash
make dev        # Start both Next.js and Flask backend
make build      # Build for production
make test       # Run linting + unit tests
make lint       # Run ESLint
make typecheck  # Run TypeScript checking
make unittest   # Run Jest tests only
```

## Project Structure
- `/` - Home page with navigation links
- `/FolderBrowser` - Folder browsing interface
- `/Table?tablePath=<path>` - Data table viewer (requires tablePath parameter)

## Important Implementation Details

### Dark Mode
- Persisted in localStorage as `darkMode` boolean
- Script in layout.tsx prevents flash of white on page load
- Uses `suppressHydrationWarning` on html element to avoid hydration errors

### URL Parameters
- `tablePath` parameter captured automatically by `UrlParamsProvider`
- Stored in Redux state at `state.ui.tablePath`
- Required for `/Table` route - shows error if missing

### Navbar Behavior
- **Minimal navbar**: Home (`/`) and FolderBrowser (`/FolderBrowser`) - only logo + settings/share
- **Full navbar**: Table (`/Table`) - includes navigation tabs + all buttons

### API Routing
- Development: `/api/*` proxied to `http://localhost:8000/api/*`
- Production: No rewrites (handled by production setup)

## Testing
- Uses Jest + React Testing Library
- Mocks Next.js navigation hooks
- Minimal tests - just ensure components render without errors
- Table page tests both with/without tablePath parameter

## Redux State Structure
```typescript
{
  ui: {
    darkMode: boolean,
    fontSize: number,
    activeTab: string,
    tablePath: string | null
  }
}
```

## Deployment & Distribution
- **Target**: Static pages bundled for Python pip package or macOS app
- **Build Priority**: Minimize bundle size for production
- **API**: Flask backend provides data endpoints

## Data Sources & Storage
- **File System**: Local file system access
- **Cloud Storage**: S3 compatible storage
- **SQL Engine**: DuckDB dialect
- **SQL Restrictions**: Read-only queries only (no INSERT/UPDATE/DELETE)

## TODO / Questions for User

### Backend Integration
- [ ] What is the expected API response format from the Flask backend?
- [ ] What endpoints will be available? (e.g., `/api/files`, `/api/data`, etc.)
- [ ] How should file paths be validated/sanitized?

### Data Table Features
- [ ] What data formats should be supported? (CSV, JSON, Parquet, etc.)
- [ ] What visualization types are needed for each tab (Samples, BubblePlot, etc.)?
- [ ] Should data be paginated? What's the expected data size?

### Folder Browser
- [ ] What file operations are needed? (view, upload, delete, etc.)
- [ ] How should folder permissions/access control work?
- [ ] How to switch between file system and S3 modes?

### FreeformSQL
- [ ] Should there be query history/saved queries?
- [ ] How to enforce read-only restrictions in the UI?
- [ ] Should there be query validation before sending to backend?

### Bundle Optimization
- [ ] Any specific libraries or features to avoid for size?
- [ ] Should we implement code splitting for different routes?
- [ ] Any compression or minification preferences?

## Development Notes
- Use `pnpm` for all package management
- Keep components minimal and focused
- Follow existing code patterns for consistency
- Always add TypeScript types
- Test new components with basic render tests
- Update this file when adding new features or patterns