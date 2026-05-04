# SmooSense Developer Docs

Quick-orientation index for AI coders and developers. Start here.

## What is SmooSense?

A no-code GUI for exploring multi-modal AI/ML datasets — tabular data with images, video, audio, embeddings, etc. Built with a Next.js frontend and a Flask/DuckDB backend, distributed as a pip package.

## Files in this directory

| File | Purpose |
|------|---------|
| [architecture-design.md](architecture-design.md) | System overview, two main views (FolderBrowser / MainTable), Redux state shape, data loading flowchart |
| [api-specs.md](api-specs.md) | Frontend ↔ backend API contract; SQL query endpoint, error format — some sections still TODO |
| [rules.md](rules.md) | **Critical** coding rules: Redux selector patterns, useEffect optimization, hook design |
| [patterns/redux.md](patterns/redux.md) | Granular selectors and `createSelector` — extracted from rules.md |
| [patterns/hooks.md](patterns/hooks.md) | `shouldFetch` pattern and hook return conventions — extracted from rules.md |
| [media-urls.md](media-urls.md) | How media asset URLs are resolved in the Query tab; points to `SqlQueryPanel.tsx` |
| [product-define.md](product-define.md) | Product positioning and comparison with Tableau, Voxel51, W&B, ChatGPT, etc. |
| [query-backends.md](query-backends.md) | Pluggable SQL backend (DuckDB or any Arrow Flight SQL service) — env vars and constructor wiring |

## User-facing docs

Live in [`../landing/public/content/docs/`](../landing/public/content/docs/) — feature guides and tutorials for end users. Not development references.

## Quick orientation for AI coders

1. **Understand the system**: Read `architecture-design.md` — especially the data loading flowchart (columnMeta → renderType → rowData/stats).
2. **Before writing any React code**: Read `rules.md` (or the `patterns/` files) — the Redux selector and `shouldFetch` patterns are performance-critical and non-obvious.
3. **API contract**: See `api-specs.md` — only `/api/query` is fully specified; other endpoints have TODOs.
4. **Media rendering**: See `media-urls.md` and the user-facing `render-type.md` for how columns map to visual renderers.
