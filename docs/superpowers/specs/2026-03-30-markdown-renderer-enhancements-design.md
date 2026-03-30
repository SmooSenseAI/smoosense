# Markdown Renderer Enhancements

**Date:** 2026-03-30
**Status:** Approved

## Overview

Enhance `CustomMarkdown` with four features: Mermaid chart rendering, AG Grid tables, hierarchical section counters on headings, and a floating table of contents panel.

## Architecture

### Component Structure

```
CustomMarkdown (modified)
└── MarkdownContext (new)
    ├── TOCFloatingPanel (new)
    └── ReactMarkdown
        ├── h1/h2/h3 → reads section number from context
        ├── code (```mermaid) → InteractiveMermaid (existing)
        └── table → MarkdownAGTable (new)
```

### New Files

- `smoosense-gui/src/components/common/MarkdownContext.tsx` — context + hook + heading extraction
- `smoosense-gui/src/components/common/TOCFloatingPanel.tsx` — floating toggle button + panel
- `smoosense-gui/src/components/common/MarkdownAGTable.tsx` — inline table wrapper around BasicAGTable

### Modified Files

- `smoosense-gui/src/components/common/CustomMarkdown.tsx` — adds context provider, new component handlers, new props

## Data Model

```ts
interface HeadingEntry {
  id: string           // slugified heading text, with -2/-3 suffix for duplicates
  level: 1 | 2 | 3
  text: string
  sectionNumber: string  // e.g. "2.1.3"
}

interface MarkdownContextValue {
  headings: HeadingEntry[]
  showTOC: boolean
  setShowTOC: (v: boolean) => void
  headingIndexRef: React.MutableRefObject<number>  // incremented by each h1/h2/h3 during render
}
```

`headings` is computed once per markdown string change via `useMemo`, using `unified` + `remark-parse` to walk the AST. Section numbers are assigned by maintaining a `[h1Count, h2Count, h3Count]` counter tuple.

## Props

```ts
interface CustomMarkdownProps {
  children: string
  disableTOC?: boolean         // default false
  tocButtonPosition?: {
    bottom?: string            // default '1.5rem'
    right?: string             // default '1.5rem'
  }
}
```

When `disableTOC` is true, the context is still created (section counters still work) but the TOC button and panel are not rendered. When the markdown contains no headings, the TOC button is not rendered regardless of `disableTOC`.

## Feature Details

### 1. Mermaid Charts

The `code` component handler checks if `className` includes `language-mermaid`. If so, renders `InteractiveMermaid` with the code block content as `definition`. The existing `InteractiveMermaid` component handles dark mode theming and error display — no changes needed to it.

```tsx
code: ({ className, children }) => {
  if (className?.includes('language-mermaid')) {
    return <InteractiveMermaid definition={String(children)} />
  }
  // existing inline code rendering
}
```

### 2. Tables via AG Grid

`MarkdownAGTable` receives parsed `react-markdown` table children and converts them to `Record<string, unknown>[]` for `BasicAGTable`. Column names come from the `thead` row.

Height behavior:
- `domLayout: 'autoHeight'` on the AG Grid instance so the grid expands to fit all rows
- CSS wrapper: `min-height: 80px`, `max-height: 300px`, `overflow-y: auto`
- When rows exceed 300px, the outer wrapper scrolls (not AG Grid internally)

Fallback: if `thead` is missing or column names cannot be parsed, renders a plain HTML `<table>` instead.

### 3. Section Counters on Headings

Each heading component calls `useMarkdownContext()` and claims the next entry from the `headings` array using a shared render-time index ref stored in the context (incremented each time any `h1`/`h2`/`h3` component renders). This index-based approach correctly handles duplicate heading text. The number is prepended to the heading:

```
2.1  My Heading
```

The `sectionNumber` is rendered in `text-muted-foreground` at a slightly smaller size. The heading element has `id` set to the slug (from context) to enable anchor navigation from the TOC.

### 4. Floating TOC Panel

**Toggle button:** Fixed position at `bottom: 1.5rem, right: 1.5rem` (configurable via `tocButtonPosition` prop). Rendered via React Portal into `document.body` to avoid z-index/overflow clipping from parent containers.

**Panel behavior:**
- Opens/closes via the toggle button — no close-on-outside-click (avoids accidental dismissal while reading)
- Explicit close button inside the panel
- Width: `240px`, with internal scroll if content overflows
- Slides in from the right side of the viewport

**Panel content:** Heading list with indentation by level, section number prefix, and anchor links. Clicking a heading scrolls to the corresponding `id` in the document and closes the panel.

## Edge Cases

| Case | Behavior |
|------|----------|
| No headings in markdown | TOC button not rendered; section counter is a no-op |
| Headings inside code blocks | remark AST traversal skips them — not counted or listed |
| Duplicate heading text | Slug gets `-2`, `-3` suffix (GitHub convention) |
| Mermaid render error | `InteractiveMermaid` shows its own error div; no extra handling |
| Table with no `thead` | Falls back to plain HTML `<table>` |
| Streaming partial markdown | Section numbers shift as content streams; acceptable since TOC is only useful post-stream |

## Dependencies

No new npm packages required. `unified` and `remark-parse` are already transitive dependencies via `react-markdown`.
