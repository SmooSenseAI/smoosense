# Local Folder Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `SMOOSENSE_LOCAL_FOLDER_PATTERN` env var that blocks all local-path API access when unset and restricts to a path prefix when set, enforced in a single Flask `before_request` hook.

**Architecture:** A `before_request` hook registered in `SmooSenseApp.create_app()` reads the env var at startup, then inspects `path` query/form params on every request. The pattern is also propagated to the frontend via the existing `PASSOVER_CONFIG` / `window.LOCAL_FOLDER_PATTERN` mechanism so the UI can show accurate error messages.

**Tech Stack:** Python 3.11 + Flask (backend), Next.js 15 / TypeScript / React (frontend), pytest/unittest (backend tests), Jest (frontend tests).

---

## File Map

| Action | File |
|--------|------|
| Modify | `smoosense-py/smoosense/app.py` — register `before_request` hook, add pattern to `passover_config` |
| Create | `smoosense-py/tests/test_local_folder_access.py` — unit tests for the access control hook |
| Modify | `smoosense-gui/src/components/home/HomeInfoSection.tsx` — replace `isLocal` check with `window.LOCAL_FOLDER_PATTERN` |
| Modify | `smoosense-gui/src/components/settings/FolderBrowserSection.tsx` — show current pattern as read-only info |

---

## Task 1: Backend — `before_request` hook with tests (TDD)

**Files:**
- Create: `smoosense-py/tests/test_local_folder_access.py`
- Modify: `smoosense-py/smoosense/app.py`

### Step 1.1: Write failing tests

- [ ] Create `smoosense-py/tests/test_local_folder_access.py` with this content:

```python
import os
import unittest
from unittest.mock import patch

from flask import Flask

from smoosense.app import SmooSenseApp


def make_app(pattern: str | None) -> Flask:
    """Create a test Flask app with the given local folder pattern."""
    env = {}
    if pattern is not None:
        env["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = pattern
    with patch.dict(os.environ, env, clear=False):
        # Remove the key if pattern is None so it is truly unset
        if pattern is None:
            os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        app = SmooSenseApp().create_app()
    app.config["TESTING"] = True
    return app


class TestLocalFolderAccessDisabled(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN is unset, local paths are blocked."""

    def setUp(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_ls_local_path_blocked(self):
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("not allowed", data["error"])

    def test_ls_tilde_path_blocked(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertEqual(response.status_code, 403)

    def test_ls_s3_path_allowed(self):
        # S3 paths must not be blocked (they may fail for other reasons, but not 403 from hook)
        response = self.client.get("/api/ls?path=s3://bucket/key")
        self.assertNotEqual(response.status_code, 403)

    def test_typeahead_local_path_blocked(self):
        response = self.client.get("/api/typeahead?path=/tmp/foo")
        self.assertEqual(response.status_code, 403)

    def test_get_file_local_path_blocked(self):
        response = self.client.get("/api/get-file?path=/tmp/foo.txt")
        self.assertEqual(response.status_code, 403)

    def test_upload_local_path_blocked(self):
        response = self.client.post(
            "/api/upload?path=/tmp/foo.txt",
            json={"content": "hello"},
        )
        self.assertEqual(response.status_code, 403)

    def test_health_endpoint_not_blocked(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)


class TestLocalFolderAccessWithPattern(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN=/tmp/, only /tmp/* paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "/tmp/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_allowed_path_passes_hook(self):
        # /tmp/foo starts with /tmp/ — hook should not block it
        # (endpoint may still return 404/500, but not 403 from the hook)
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_disallowed_path_blocked(self):
        response = self.client.get("/api/ls?path=/etc/passwd")
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("not allowed", data["error"])

    def test_tilde_path_blocked_when_pattern_is_absolute(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertEqual(response.status_code, 403)

    def test_s3_path_allowed(self):
        response = self.client.get("/api/ls?path=s3://bucket/key")
        self.assertNotEqual(response.status_code, 403)

    def test_upload_allowed_path_passes_hook(self):
        response = self.client.post(
            "/api/upload?path=/tmp/foo.txt",
            json={"content": "hello"},
        )
        self.assertNotEqual(response.status_code, 403)

    def test_upload_disallowed_path_blocked(self):
        response = self.client.post(
            "/api/upload?path=/etc/foo.txt",
            json={"content": "hello"},
        )
        self.assertEqual(response.status_code, 403)


class TestLocalFolderAccessTildePattern(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN=~/, tilde paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "~/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_tilde_path_allowed(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_absolute_path_blocked(self):
        response = self.client.get("/api/ls?path=/etc/passwd")
        self.assertEqual(response.status_code, 403)


class TestPassoverConfig(unittest.TestCase):
    """SMOOSENSE_LOCAL_FOLDER_PATTERN is reflected in PASSOVER_CONFIG."""

    def test_pattern_in_passover_config_when_set(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "/mnt/"
        try:
            app = SmooSenseApp().create_app()
            self.assertEqual(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PATTERN"], "/mnt/")
        finally:
            os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_pattern_null_in_passover_config_when_unset(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        app = SmooSenseApp().create_app()
        self.assertIsNone(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PATTERN"])


if __name__ == "__main__":
    unittest.main()
```

### Step 1.2: Run tests to verify they fail

- [ ] Run:
```bash
cd smoosense-py && uv run pytest tests/test_local_folder_access.py -v 2>&1 | head -60
```
Expected: Most tests FAIL — `before_request` hook doesn't exist yet.

### Step 1.3: Implement the `before_request` hook in `app.py`

- [ ] In `smoosense-py/smoosense/app.py`, make the following changes:

1. Add `LOCAL_FOLDER_PATTERN` to `passover_config` in `__init__`:

```python
self.local_folder_pattern: str | None = os.environ.get("SMOOSENSE_LOCAL_FOLDER_PATTERN")

self.passover_config = {
    "S3_PREFIX_TO_SAVE_SHAREABLE_LINK": s3_prefix_to_save_shareable_link,
    "FOLDER_SHORTCUTS": folder_shortcuts or {},
    "LOCAL_FOLDER_PATTERN": self.local_folder_pattern,
}
```

Also add `jsonify` and `request` to the existing Flask import at the top of `app.py`:
```python
from flask import Flask, jsonify, request
```
And add `Response` to the return type import:
```python
from flask import Flask, Response, jsonify, request
```

2. Add a `_check_local_path_access` method to `SmooSenseApp`:

```python
def _check_local_path_access(self) -> tuple[Response, int] | None:
    """Flask before_request hook: block local path access based on config."""
    path_params = [
        request.args.get("path", ""),
        request.args.get("prefix", ""),
        request.form.get("path", ""),
    ]

    for path in path_params:
        if not path:
            continue
        # Only check local paths (absolute or tilde-relative)
        if not (path.startswith("/") or path.startswith("~/")):
            continue
        # Local path detected — enforce pattern
        if self.local_folder_pattern is None:
            return jsonify({"error": "Local folder access is not allowed"}), 403
        if not path.startswith(self.local_folder_pattern):
            return jsonify({"error": "Path not allowed by server configuration"}), 403
```

3. Register the hook in `create_app()`, after blueprints are registered:

```python
app.before_request(self._check_local_path_access)
```

Full updated `create_app` tail (only the added line, place it just before `return app`):
```python
        app.before_request(self._check_local_path_access)

        return app
```

### Step 1.4: Run tests to verify they pass

- [ ] Run:
```bash
cd smoosense-py && uv run pytest tests/test_local_folder_access.py -v
```
Expected: All tests PASS.

### Step 1.5: Run full test suite to check for regressions

- [ ] Run:
```bash
cd smoosense-py && make test
```
Expected: All existing tests still pass. (Integration tests that browse local paths will need `SMOOSENSE_LOCAL_FOLDER_PATTERN` set — see note below.)

> **Note:** The existing integration tests in `intests/test_folder_browser.py` browse local paths. When running them, set `SMOOSENSE_LOCAL_FOLDER_PATTERN=/` to allow all local paths, or set it to the parent directory prefix used in the tests (the repo root).

### Step 1.6: Run type checking and linting

- [ ] Run:
```bash
cd smoosense-py && uv run ruff check smoosense && uv run ruff format --check smoosense && uv run mypy smoosense
```
Fix any issues before committing.

### Step 1.7: Commit

- [ ] Run:
```bash
cd smoosense-py
git add smoosense/app.py tests/test_local_folder_access.py
git commit -m "feat: enforce local folder access via SMOOSENSE_LOCAL_FOLDER_PATTERN env var"
```

---

## Task 2: Frontend — config-driven error messages

**Files:**
- Modify: `smoosense-gui/src/components/home/HomeInfoSection.tsx`
- Modify: `smoosense-gui/src/components/settings/FolderBrowserSection.tsx`

### Step 2.1: Write failing test for HomeInfoSection

- [ ] Add a test case to the existing Jest test file for `HomeInfoSection` (or create one at `smoosense-gui/src/components/home/__tests__/HomeInfoSection.test.tsx` if it doesn't exist):

```tsx
// smoosense-gui/src/components/home/__tests__/HomeInfoSection.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import HomeInfoSection from '../HomeInfoSection'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>)
}

describe('HomeInfoSection — local folder access messages', () => {
  afterEach(() => {
    // Reset window globals between tests
    delete (window as any).LOCAL_FOLDER_PATTERN
  })

  it('shows "not supported" error when LOCAL_FOLDER_PATTERN is null', async () => {
    ;(window as any).LOCAL_FOLDER_PATTERN = null
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/not supported on this server/i)).toBeInTheDocument()
  })

  it('shows pattern-specific error when LOCAL_FOLDER_PATTERN is set', async () => {
    ;(window as any).LOCAL_FOLDER_PATTERN = '/mnt/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '/etc/passwd')
    expect(screen.getByText(/must start with \/mnt\//i)).toBeInTheDocument()
  })

  it('shows generic local error when LOCAL_FOLDER_PATTERN is "/"', async () => {
    ;(window as any).LOCAL_FOLDER_PATTERN = '/'
    renderWithStore(<HomeInfoSection />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'not-a-valid-path')
    expect(screen.getByText(/must start with \/, ~, or s3:\/\//i)).toBeInTheDocument()
  })
})
```

- [ ] Run to verify it fails:
```bash
cd smoosense-gui && pnpm test -- --testPathPattern=HomeInfoSection 2>&1 | tail -30
```
Expected: FAIL — current component doesn't read `window.LOCAL_FOLDER_PATTERN`.

### Step 2.2: Update `HomeInfoSection.tsx`

- [ ] Replace the `isLocal` state, its `useEffect`, and the `getPathType` function with config-driven logic.

The new `getPathType` function:
```typescript
function getLocalFolderPattern(): string | null {
  if (typeof window === 'undefined') return null
  const val = (window as { LOCAL_FOLDER_PATTERN?: string | null }).LOCAL_FOLDER_PATTERN
  return val ?? null
}

function getPathType(path: string): PathType {
  const trimmed = path.trim()
  if (!trimmed) return 'empty'
  if (trimmed.startsWith('s3://') || 's3://'.startsWith(trimmed)) return 's3'
  if (trimmed.startsWith('/') || trimmed.startsWith('~')) {
    return getLocalFolderPattern() !== undefined && getLocalFolderPattern() !== null
      ? 'local'
      : 'invalid'
  }
  return 'invalid'
}
```

Wait — we need to be precise here. The logic should be:

- If path starts with `/` or `~`:
  - `LOCAL_FOLDER_PATTERN` is `null` (unset) → `'invalid'`
  - `LOCAL_FOLDER_PATTERN` is a string → `'local'` (the backend will enforce the prefix; frontend just allows submission)
- Otherwise → `'invalid'`

Updated `getPathType`:
```typescript
function getLocalFolderPattern(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { LOCAL_FOLDER_PATTERN?: string | null }
  return w.LOCAL_FOLDER_PATTERN ?? null
}

function getPathType(path: string): PathType {
  const trimmed = path.trim()
  if (!trimmed) return 'empty'
  if (trimmed.startsWith('s3://') || 's3://'.startsWith(trimmed)) return 's3'
  if (trimmed.startsWith('/') || trimmed.startsWith('~')) {
    const pattern = getLocalFolderPattern()
    if (pattern === null) return 'invalid'          // local access disabled
    if (!trimmed.startsWith(pattern)) return 'invalid'  // outside allowed prefix
    return 'local'
  }
  return 'invalid'
}
```

Replace the error message JSX (currently lines 185–193 of `HomeInfoSection.tsx`):
```tsx
{showError && (
  <div className="flex items-center gap-2 text-red-500 text-sm mb-6">
    <AlertCircle className="h-4 w-4" />
    {(() => {
      const pattern = getLocalFolderPattern()
      if (pattern === null) {
        return 'Local paths are not supported on this server'
      }
      if (pattern === '/' || pattern === '~/') {
        return 'Path must start with /, ~, or s3://'
      }
      return `Path must start with ${pattern} or s3://`
    })()}
  </div>
)}
```

Replace the heading (currently line 142):
```tsx
<h2 className="text-xl font-semibold text-foreground mb-6">
  {getLocalFolderPattern() !== null ? 'Browse local or S3 folders' : 'Browse S3 folders'}
</h2>
```

Replace the input placeholder (currently lines 150–153):
```tsx
placeholder={
  getLocalFolderPattern() !== null
    ? "Enter folder path (e.g., /tmp/folder, ~/Downloads or s3://bucket/path)"
    : "Enter S3 path (e.g., s3://bucket/path)"
}
```

Also remove the `isLocal` state variable and its `useEffect` (lines 30 and 37–40), and update `getPathType` call sites — it no longer takes `isLocal` as a parameter. Remove `isLocal` from `fetchSuggestions` call too.

Update `fetchSuggestions` (remove `local` parameter):
```typescript
const fetchSuggestions = useMemo(
  () =>
    debounce(async (path: string) => {
      const pathType = getPathType(path)
      if (pathType === 'empty' || pathType === 'invalid') {
        setSuggestions([])
        return
      }

      try {
        const endpoint = pathType === 's3'
          ? `${API_PREFIX}/s3-typeahead`
          : `${API_PREFIX}/typeahead`

        const response = await fetch(`${endpoint}?path=${encodeURIComponent(path)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setShowSuggestions(data.length > 0)
          setSelectedIndex(-1)
        }
      } catch {
        setSuggestions([])
      }
    }, 300),
  []
)
```

Update call sites of `fetchSuggestions` to drop the second argument:
- Line 102: `fetchSuggestions(value, isLocal)` → `fetchSuggestions(value)`
- Line 110: `fetchSuggestions(suggestion, isLocal)` → `fetchSuggestions(suggestion)`

Update `pathType` computation (line 136):
```typescript
const pathType = getPathType(folderPath)
```

### Step 2.3: Run tests to verify they pass

- [ ] Run:
```bash
cd smoosense-gui && pnpm test -- --testPathPattern=HomeInfoSection 2>&1 | tail -30
```
Expected: All tests PASS.

### Step 2.4: Update `FolderBrowserSection.tsx`

- [ ] Replace the stub with a read-only display of the current pattern:

```tsx
'use client'

function getLocalFolderPattern(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { LOCAL_FOLDER_PATTERN?: string | null }
  return w.LOCAL_FOLDER_PATTERN ?? null
}

export default function FolderBrowserSection() {
  const pattern = getLocalFolderPattern()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4">Folder Browser Settings</h3>

      <div className="text-sm">
        <span className="text-muted-foreground">Local folder access: </span>
        {pattern !== null ? (
          <span className="font-mono">enabled (prefix: {pattern})</span>
        ) : (
          <span className="text-muted-foreground">disabled</span>
        )}
      </div>
    </div>
  )
}
```

### Step 2.5: Run full frontend tests

- [ ] Run:
```bash
cd smoosense-gui && make test
```
Expected: All tests pass.

### Step 2.6: Commit

- [ ] Run:
```bash
cd smoosense-gui
git add src/components/home/HomeInfoSection.tsx src/components/settings/FolderBrowserSection.tsx
# Add new test file if created
git add src/components/home/__tests__/HomeInfoSection.test.tsx 2>/dev/null || true
git commit -m "feat: replace isLocal check with LOCAL_FOLDER_PATTERN config in folder browser UI"
```

---

## Task 3: Manual smoke test

### Step 3.1: Test with pattern disabled (default)

- [ ] Start the backend without the env var:
```bash
cd smoosense-py && uv run app_dev.py
```
- [ ] Open browser at `http://localhost:8000`
- [ ] Type a local path like `/tmp/foo` in the folder input → should show "Local paths are not supported on this server"
- [ ] Try `curl 'http://localhost:8000/api/ls?path=/tmp'` → should return `403 {"error": "Local folder access is not allowed"}`

### Step 3.2: Test with pattern enabled

- [ ] Restart the backend with the env var:
```bash
cd smoosense-py && SMOOSENSE_LOCAL_FOLDER_PATTERN=/ uv run app_dev.py
```
- [ ] Open browser at `http://localhost:8000`
- [ ] Heading should say "Browse local or S3 folders"
- [ ] Type `/etc` → input accepts it, Go button is enabled
- [ ] Settings panel should show "Local folder access: enabled (prefix: /)"
- [ ] Try `curl 'http://localhost:8000/api/ls?path=/tmp'` → should return `200`

### Step 3.3: Test with restricted pattern

- [ ] Restart:
```bash
SMOOSENSE_LOCAL_FOLDER_PATTERN=/tmp/ uv run app_dev.py
```
- [ ] `curl 'http://localhost:8000/api/ls?path=/tmp'` → `200`
- [ ] `curl 'http://localhost:8000/api/ls?path=/etc'` → `403 {"error": "Path not allowed by server configuration"}`
- [ ] Browser: type `/etc` → shows "Path must start with /tmp/ or s3://"
