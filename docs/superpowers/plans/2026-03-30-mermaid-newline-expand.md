# Mermaid Chart: \n Fix + Expand Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `\n` rendering in mermaid node labels and add a hover-triggered expand button that opens a full-size dialog view.

**Architecture:** All changes live in `InteractiveMermaid.tsx`. A `\n` → `<br>` substitution runs before `mermaid.render()`. An expand button (visible on hover via CSS `group`) opens a Radix `Dialog` containing a second `InteractiveMermaid` instance rendered without size caps. An internal `expanded` prop suppresses the button and size caps in the dialog's inner instance.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons, Radix UI Dialog (`@/components/ui/dialog`), mermaid.js

---

## Files

- Modify: `smoosense-gui/src/components/common/InteractiveMermaid.tsx`
- Modify: `smoosense-gui/src/components/common/__tests__/InteractiveMermaid.test.tsx`

---

### Task 1: Write failing tests for `\n` → `<br>` preprocessing

**Files:**
- Modify: `smoosense-gui/src/components/common/__tests__/InteractiveMermaid.test.tsx`

- [ ] **Step 1: Replace the test file with updated tests**

Replace the full contents of `smoosense-gui/src/components/common/__tests__/InteractiveMermaid.test.tsx`:

```tsx
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import mermaid from 'mermaid'
import InteractiveMermaid from '../InteractiveMermaid'

beforeEach(() => {
  (mermaid.render as jest.Mock).mockClear()
})

describe('InteractiveMermaid', () => {
  const mockDefinition = `
    graph TB
      A[Node A]
      B[Node B]
      A --> B
  `

  it('should render with basic definition', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    expect(document.querySelector('[class*="w-full h-full"]')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<InteractiveMermaid definition={mockDefinition} className="custom-class" />)
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should replace literal \\n with <br> before passing to mermaid.render', async () => {
    const mockRender = mermaid.render as jest.Mock
    render(
      <InteractiveMermaid definition={'graph TB\n  A["Line1\\nLine2"] --> B'} />
    )
    await waitFor(() => {
      expect(mockRender).toHaveBeenCalled()
    })
    const calledWith = mockRender.mock.calls[0][1] as string
    expect(calledWith).toContain('<br>')
    expect(calledWith).not.toContain('\\n')
  })

  it('should render an expand button', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    expect(screen.getByRole('button', { name: /expand chart/i })).toBeInTheDocument()
  })

  it('should open a dialog when the expand button is clicked', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    fireEvent.click(screen.getByRole('button', { name: /expand chart/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should close the dialog when the close button is clicked', () => {
    render(<InteractiveMermaid definition={mockDefinition} />)
    fireEvent.click(screen.getByRole('button', { name: /expand chart/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should not render an expand button when expanded prop is true', () => {
    render(<InteractiveMermaid definition={mockDefinition} expanded />)
    expect(
      screen.queryByRole('button', { name: /expand chart/i })
    ).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new tests — they should fail on the new cases**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern=InteractiveMermaid --no-coverage
```

Expected: existing two tests pass; four new tests fail (expand button not found, dialog not found, `\n` not replaced).

---

### Task 2: Implement `\n` → `<br>` preprocessing

**Files:**
- Modify: `smoosense-gui/src/components/common/InteractiveMermaid.tsx`

- [ ] **Step 1: Add sanitization before `mermaid.render()`**

In `InteractiveMermaid.tsx`, find the line inside `renderMermaid`:
```ts
const { svg } = await mermaid.render(mermaidId.current, definition)
```

Replace it with:
```ts
const sanitized = definition.replace(/\\n/g, '<br>')
const { svg } = await mermaid.render(mermaidId.current, sanitized)
```

- [ ] **Step 2: Run tests — the `\n` test should now pass**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern=InteractiveMermaid --no-coverage
```

Expected: `\n` → `<br>` test passes. Expand button tests still fail.

---

### Task 3: Implement hover expand button and full-size dialog

**Files:**
- Modify: `smoosense-gui/src/components/common/InteractiveMermaid.tsx`

- [ ] **Step 1: Replace the full file contents**

Replace `smoosense-gui/src/components/common/InteractiveMermaid.tsx` with:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Expand, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CLS } from '@/lib/utils/styles'

let mermaidIdCounter = 0

interface InteractiveMermaidProps {
  definition: string
  className?: string
  /** Internal: when true, removes size caps and hides the expand button */
  expanded?: boolean
}

export default function InteractiveMermaid({
  definition,
  className = 'w-full h-full',
  expanded = false,
}: InteractiveMermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const mermaidId = useRef(`mermaid-graph-${++mermaidIdCounter}`)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 10 },
      themeVariables: { fontSize: '14px' },
    })
  }, [])

  useEffect(() => {
    if (!mermaidRef.current) return

    const renderMermaid = async () => {
      if (!mermaidRef.current) return

      try {
        mermaidRef.current.innerHTML = ''
        const sanitized = definition.replace(/\\n/g, '<br>')
        const { svg } = await mermaid.render(mermaidId.current, sanitized)
        mermaidRef.current.innerHTML = svg

        const svgElement = mermaidRef.current.querySelector('svg')
        if (svgElement) {
          Object.assign(svgElement.style, {
            width: '100%',
            height: 'auto',
            ...(expanded ? {} : { maxWidth: '600px', maxHeight: '400px' }),
            display: 'block',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
          })

          const applyStyles = (selector: string, styles: Partial<CSSStyleDeclaration>) => {
            svgElement.querySelectorAll(selector).forEach(el =>
              Object.assign((el as HTMLElement).style, styles)
            )
          }

          applyStyles('.node', { fill: 'var(--muted)', stroke: 'var(--foreground)', strokeWidth: '2px' })
          applyStyles('text, .label', { fontSize: '0.875rem', fontFamily: 'var(--font-sans)', fill: 'var(--foreground)' })
          applyStyles('path', { stroke: 'var(--muted-foreground)', strokeWidth: '2px' })
          applyStyles('marker', { fill: 'var(--muted-foreground)' })
          applyStyles('polyline', { stroke: 'var(--muted-foreground)', strokeWidth: '2px', fill: 'none' })
        }
      } catch (error) {
        if (mermaidRef.current) {
          const message = error instanceof Error ? error.message : String(error)
          mermaidRef.current.innerHTML = `<pre class="p-3 text-xs text-red-500 whitespace-pre-wrap border border-red-200 rounded bg-red-50 dark:bg-red-950/20">${message}</pre>`
        }
      }
    }

    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [definition, expanded])

  return (
    <div className={`${className} relative group`}>
      <div ref={mermaidRef} className="w-full h-full text-sm font-sans" />

      {!expanded && (
        <>
          <button
            aria-label="Expand chart"
            onClick={() => setIsDialogOpen(true)}
            className={`${CLS.ICON_BUTTON_SM} absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <Expand className="h-4 w-4" />
          </button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent
              className="max-w-none p-0 flex flex-col"
              style={{ width: '90vw', height: '90vh' }}
              aria-describedby={undefined}
            >
              <DialogHeader className="p-4 pb-2 flex-shrink-0">
                <DialogTitle className="flex items-center justify-between">
                  <span>Chart</span>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className={CLS.ICON_BUTTON_SM}
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-4">
                {isDialogOpen && (
                  <InteractiveMermaid
                    definition={definition}
                    className="w-full"
                    expanded
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern=InteractiveMermaid --no-coverage
```

Expected: all 7 tests pass.

- [ ] **Step 3: Run the full test suite**

```bash
cd smoosense-gui && pnpm test --no-coverage
```

Expected: no regressions, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add smoosense-gui/src/components/common/InteractiveMermaid.tsx \
        smoosense-gui/src/components/common/__tests__/InteractiveMermaid.test.tsx
git commit -m "feat: replace \\n with <br> in mermaid labels and add hover expand dialog"
```
