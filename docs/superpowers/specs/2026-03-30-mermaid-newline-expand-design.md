# Mermaid Chart: \n Fix + Expand Dialog

**Date:** 2026-03-30  
**Status:** Approved

## Problem

1. Node text containing the literal two-character sequence `\n` is passed straight to mermaid, which does not interpret it — the text renders as `\n` instead of a line break.
2. Charts are small and can only be read at compact size; no way to view a larger version.

## Changes

**Single file:** `smoosense-gui/src/components/common/InteractiveMermaid.tsx`

---

## Feature 1: \n → `<br>` Preprocessing

Before calling `mermaid.render()`, replace every literal `\n` (backslash + n) with `<br>`:

```ts
const sanitized = definition.replace(/\\n/g, '<br>')
const { svg } = await mermaid.render(mermaidId.current, sanitized)
```

`htmlLabels: true` is already configured, so `<br>` inside node labels is supported.

---

## Feature 2: Hover Expand Button + Full-Size Dialog

### Hover button

- Wrap the mermaid render div in a `relative group` container.
- Overlay an `Expand` icon button (Lucide `Expand` icon) pinned `absolute top-2 right-2`.
- Visible only on hover: `opacity-0 group-hover:opacity-100 transition-opacity`.
- Uses existing `CLS.ICON_BUTTON_SM` style for visual consistency.

### Dialog

- On button click, open a Radix `Dialog` (from `@/components/ui/dialog`).
- Dialog size: `90vw × 90vh` (matches existing `IconDialog` pattern).
- Content: a second `InteractiveMermaid` render of the same `definition`.
- SVG size caps (`maxWidth: 600px`, `maxHeight: 400px`) are removed in the expanded instance — the SVG grows to its natural size inside a scrollable container.
- Dialog has a close (`X`) button in the top-right header.

---

## No New Files

All changes are contained in `InteractiveMermaid.tsx`. No new components, no new files.
