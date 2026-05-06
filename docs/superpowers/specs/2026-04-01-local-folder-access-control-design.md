# Local Folder Access Control — Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Problem

When deployed on cloud, SmooSense should not allow users to browse the server's local filesystem. Currently the restriction is client-side only (`HomeInfoSection.tsx` checks the browser URL) — the backend APIs accept any local path regardless. This means the UI shows an error message but nothing actually blocks the API calls.

## Goal

Make local folder access configurable via a single environment variable, with backend enforcement on all relevant endpoints.

---

## Configuration

### Environment Variable: `SMOOSENSE_LOCAL_FOLDER_PATTERN`

| State | Behavior |
|-------|----------|
| Unset | Local folder access **disabled**. All local path requests return `403`. |
| Set to a prefix string (e.g. `/mnt/`, `~/data/`, `/`) | Local folder access **enabled** for paths starting with that prefix only. |

**Examples:**
- `SMOOSENSE_LOCAL_FOLDER_PATTERN=/mnt/` — only paths under `/mnt/` are allowed
- `SMOOSENSE_LOCAL_FOLDER_PATTERN=/` — all local paths allowed
- *(unset)* — no local paths allowed

---

## Backend — Enforcement (Flask `before_request` hook)

### What changes

A `before_request` hook is registered in `SmooSenseApp.__init__` (`smoosense/app.py`).

### Logic

1. Read `SMOOSENSE_LOCAL_FOLDER_PATTERN` once at startup and store on the app instance.
2. On each request, inspect all query params and form fields that may carry a path: `path`, `prefix`.
3. For each such value, check if it is a **local path**: starts with `/` or `~/`.
4. If local path detected:
   - If `LOCAL_FOLDER_PATTERN` is unset → return `403 {"error": "Local folder access is not allowed"}`
   - If set but the path does not start with the pattern → return `403 {"error": "Path not allowed by server configuration"}`
   - Otherwise → allow the request through

S3 paths (`s3://`) and empty values are not local paths and always pass through.

### Endpoints covered

The hook applies globally, covering all four local-path endpoints:
- `GET /api/ls`
- `GET /api/typeahead`
- `GET /api/get-file`
- `POST /api/upload`

No per-endpoint changes needed. Future endpoints that accept path params are automatically protected.

---

## Backend — Config Propagation to Frontend

`PASSOVER_CONFIG` (injected into `window.PASSOVER_CONFIG` via `handlers/pages.py`) gains one new field:

```python
{
  "LOCAL_FOLDER_PATTERN": os.environ.get("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
}
```

`null` when unset, a string value when set.

---

## Frontend — Error Handling

### `HomeInfoSection.tsx`

The current client-side `isLocal` check (based on browser URL) is replaced with config-driven logic reading `PASSOVER_CONFIG.LOCAL_FOLDER_PATTERN`:

| `LOCAL_FOLDER_PATTERN` value | Error message shown |
|-----------------------------|---------------------|
| `null` (unset) | `"Local paths are not supported on this server"` |
| A prefix string (e.g. `/mnt/`) | `"Path must start with /mnt/ or s3://"` |
| `/` or `~/` (fully open) | `"Path must start with /, ~, or s3://"` |

### `FolderBrowserSection.tsx`

The existing empty stub displays the current allowed pattern as read-only info. For example: `"Local folder access: enabled (prefix: /mnt/)"` or `"Local folder access: disabled"`.

---

## What Does NOT Change

- S3 path handling — unaffected
- `folder_shortcuts` config — unaffected
- Auth0 integration — unaffected
- Frontend Redux state / tree rendering — unaffected

---

## Out of Scope

- Write/delete restrictions (only read/browse access is in scope)
- Per-user access control
- Multiple allowed prefixes (single prefix only)
