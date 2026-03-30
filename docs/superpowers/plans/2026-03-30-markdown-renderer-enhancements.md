# Markdown Renderer Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `CustomMarkdown` with mermaid chart rendering, AG Grid tables, hierarchical section counters on headings, and a floating table of contents panel.

**Architecture:** Pre-parse markdown headings via regex (strips code blocks first) to compute section numbers and TOC data before rendering. A React Context (`MarkdownContext`) distributes this data to heading components and the TOC panel. The four features are implemented as three new focused files plus modifications to the existing `CustomMarkdown`.

**Tech Stack:** React, TypeScript, react-markdown (existing), AG Grid via `BasicAGTable` (existing), mermaid via `InteractiveMermaid` (existing), React Portal for TOC panel.

> **Spec deviation note:** The spec proposed using `unified` + `remark-parse` for heading extraction, but these packages are ESM-only and not directly accessible in the pnpm layout. A regex-based extractor (with fenced code block stripping) is used instead — it handles all documented edge cases and requires zero new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/common/MarkdownContext.tsx` | Heading extraction, section numbering, React Context + Provider + hook |
| Create | `src/components/common/MarkdownAGTable.tsx` | Parse HAST table node → AG Grid data; capped-height wrapper |
| Create | `src/components/common/TOCFloatingPanel.tsx` | Fixed-position toggle button + slide-in panel via React Portal |
| Modify | `src/components/common/CustomMarkdown.tsx` | Add context provider, mermaid handler, table handler, section-numbered headings, new props |
| Create | `src/components/common/__tests__/MarkdownContext.test.tsx` | Unit tests for `computeHeadings` pure function |
| Create | `src/components/common/__tests__/MarkdownAGTable.test.tsx` | Render tests for table parsing + fallback |
| Create | `src/components/common/__tests__/TOCFloatingPanel.test.tsx` | Render + interaction tests for TOC panel |
| Modify | `src/components/common/__tests__/CustomMarkdown.test.tsx` | Smoke tests for the integrated component |

All paths are relative to `smoosense-gui/`.

---

## Task 1: MarkdownContext — heading extraction and context

**Files:**
- Create: `src/components/common/MarkdownContext.tsx`
- Create: `src/components/common/__tests__/MarkdownContext.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/common/__tests__/MarkdownContext.test.tsx`:

```tsx
import { computeHeadings } from '../MarkdownContext'

describe('computeHeadings', () => {
  it('returns empty array for markdown with no headings', () => {
    expect(computeHeadings('Just some **text** here.')).toEqual([])
  })

  it('assigns section numbers to flat h1 headings', () => {
    const md = `# First\n# Second\n# Third`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['1', '2', '3'])
  })

  it('assigns hierarchical section numbers', () => {
    const md = `# Intro\n## Background\n### Details\n## Summary`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['1', '1.1', '1.1.1', '1.2'])
  })

  it('resets sub-counters when parent heading repeats', () => {
    const md = `# One\n## A\n## B\n# Two\n## C`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['1', '1.1', '1.2', '2', '2.1'])
  })

  it('slugifies heading text for id', () => {
    const result = computeHeadings('# Hello World')
    expect(result[0].id).toBe('hello-world')
  })

  it('deduplicates slug ids for duplicate headings', () => {
    const result = computeHeadings('# Same\n# Same\n# Same')
    expect(result[0].id).toBe('same')
    expect(result[1].id).toBe('same-2')
    expect(result[2].id).toBe('same-3')
  })

  it('does not count headings inside fenced code blocks', () => {
    const md = `# Real\n\`\`\`\n# Fake\n\`\`\``
    const result = computeHeadings(md)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Real')
  })

  it('ignores h4 and deeper headings', () => {
    const result = computeHeadings('# H1\n#### H4')
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(1)
  })

  it('exposes correct level and text on each entry', () => {
    const result = computeHeadings('# Title\n## Section')
    expect(result[0]).toMatchObject({ level: 1, text: 'Title' })
    expect(result[1]).toMatchObject({ level: 2, text: 'Section' })
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="MarkdownContext" --no-coverage
```

Expected: FAIL — `Cannot find module '../MarkdownContext'`

- [ ] **Step 3: Create MarkdownContext.tsx**

Create `src/components/common/MarkdownContext.tsx`:

```tsx
'use client'

import React, { createContext, useContext, useMemo, useRef, useState } from 'react'

export interface HeadingEntry {
  id: string
  level: 1 | 2 | 3
  text: string
  sectionNumber: string
}

export interface MarkdownContextValue {
  headings: HeadingEntry[]
  showTOC: boolean
  setShowTOC: (v: boolean) => void
  headingIndexRef: React.MutableRefObject<number>
}

const MarkdownContext = createContext<MarkdownContextValue | null>(null)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function computeHeadings(markdown: string): HeadingEntry[] {
  // Strip fenced code blocks then inline code to avoid false heading matches
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')

  const headingRegex = /^(#{1,3})[ \t]+(.+)$/gm
  const counters: [number, number, number] = [0, 0, 0]
  const slugCounts: Record<string, number> = {}
  const result: HeadingEntry[] = []

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length as 1 | 2 | 3
    const text = match[2].trim()

    counters[level - 1]++
    for (let i = level; i < 3; i++) counters[i] = 0

    const sectionNumber = counters.slice(0, level).join('.')

    const baseSlug = slugify(text)
    const count = slugCounts[baseSlug] ?? 0
    slugCounts[baseSlug] = count + 1
    const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

    result.push({ id, level, text, sectionNumber })
  }

  return result
}

interface MarkdownProviderProps {
  children: React.ReactNode
  markdown: string
}

export function MarkdownProvider({ children, markdown }: MarkdownProviderProps) {
  const [showTOC, setShowTOC] = useState(false)
  const headingIndexRef = useRef(0)
  const headings = useMemo(() => computeHeadings(markdown), [markdown])

  // Reset heading index before each render so h1/h2/h3 components claim entries in order
  headingIndexRef.current = 0

  return (
    <MarkdownContext.Provider value={{ headings, showTOC, setShowTOC, headingIndexRef }}>
      {children}
    </MarkdownContext.Provider>
  )
}

export function useMarkdownContext(): MarkdownContextValue {
  const ctx = useContext(MarkdownContext)
  if (!ctx) throw new Error('useMarkdownContext must be used within MarkdownProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="MarkdownContext" --no-coverage
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
cd smoosense-gui && git add src/components/common/MarkdownContext.tsx src/components/common/__tests__/MarkdownContext.test.tsx
git commit -m "feat: add MarkdownContext with heading extraction and section numbering"
```

---

## Task 2: MarkdownAGTable — inline AG Grid table

**Files:**
- Create: `src/components/common/MarkdownAGTable.tsx`
- Create: `src/components/common/__tests__/MarkdownAGTable.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/common/__tests__/MarkdownAGTable.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createTestStore } from '@/lib/test-utils'
import MarkdownAGTable from '../MarkdownAGTable'

// ag-grid-react is mocked in jest.config.js → renders <div data-testid="ag-grid-mock">

const store = createTestStore()

function makeTableNode(columns: string[], rows: string[][]) {
  return {
    type: 'element',
    tagName: 'table',
    children: [
      {
        type: 'element',
        tagName: 'thead',
        children: [{
          type: 'element',
          tagName: 'tr',
          children: columns.map(col => ({
            type: 'element',
            tagName: 'th',
            children: [{ type: 'text', value: col }]
          }))
        }]
      },
      {
        type: 'element',
        tagName: 'tbody',
        children: rows.map(row => ({
          type: 'element',
          tagName: 'tr',
          children: row.map(cell => ({
            type: 'element',
            tagName: 'td',
            children: [{ type: 'text', value: cell }]
          }))
        }))
      }
    ]
  }
}

describe('MarkdownAGTable', () => {
  it('renders AG Grid when a valid table node is provided', () => {
    const node = makeTableNode(['Name', 'Age'], [['John', '30'], ['Jane', '25']])
    render(
      <Provider store={store}>
        <MarkdownAGTable node={node} />
      </Provider>
    )
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).toBeInTheDocument()
  })

  it('falls back to plain <table> when no node is provided', () => {
    const { container } = render(
      <Provider store={store}>
        <MarkdownAGTable>
          <tbody><tr><td>fallback</td></tr></tbody>
        </MarkdownAGTable>
      </Provider>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).not.toBeInTheDocument()
  })

  it('falls back to plain <table> when thead is missing', () => {
    const node = {
      type: 'element',
      tagName: 'table',
      children: [{
        type: 'element',
        tagName: 'tbody',
        children: [{ type: 'element', tagName: 'tr', children: [] }]
      }]
    }
    const { container } = render(
      <Provider store={store}>
        <MarkdownAGTable node={node} />
      </Provider>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="MarkdownAGTable" --no-coverage
```

Expected: FAIL — `Cannot find module '../MarkdownAGTable'`

- [ ] **Step 3: Create MarkdownAGTable.tsx**

Create `src/components/common/MarkdownAGTable.tsx`:

```tsx
'use client'

import React from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'

interface HastNode {
  type: string
  value?: string
  tagName?: string
  children?: HastNode[]
}

interface MarkdownAGTableProps {
  node?: HastNode
  children?: React.ReactNode
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

function parseTableData(node: HastNode): { rows: Record<string, unknown>[] } | null {
  if (!node.children) return null

  const thead = node.children.find(c => c.tagName === 'thead')
  const tbody = node.children.find(c => c.tagName === 'tbody')
  if (!thead || !tbody) return null

  const headerRow = thead.children?.find(c => c.tagName === 'tr')
  if (!headerRow?.children) return null

  const columns = headerRow.children
    .filter(c => c.tagName === 'th')
    .map(th => getTextContent(th))

  if (columns.length === 0) return null

  const rows = (tbody.children ?? [])
    .filter(c => c.tagName === 'tr')
    .map(tr => {
      const cells = (tr.children ?? [])
        .filter(c => c.tagName === 'td')
        .map(td => getTextContent(td))
      return Object.fromEntries(columns.map((col, i) => [col, cells[i] ?? '']))
    })

  return { rows }
}

export default function MarkdownAGTable({ node, children }: MarkdownAGTableProps) {
  if (!node) return <table>{children}</table>

  const parsed = node ? parseTableData(node) : null
  if (!parsed) return <table>{children}</table>

  return (
    <div style={{ minHeight: '80px', maxHeight: '300px', overflowY: 'auto' }} className="my-3">
      <BasicAGTable
        data={parsed.rows}
        gridOptionOverrides={{ domLayout: 'autoHeight' }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="MarkdownAGTable" --no-coverage
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
cd smoosense-gui && git add src/components/common/MarkdownAGTable.tsx src/components/common/__tests__/MarkdownAGTable.test.tsx
git commit -m "feat: add MarkdownAGTable for inline AG Grid tables in markdown"
```

---

## Task 3: TOCFloatingPanel — floating button and panel

**Files:**
- Create: `src/components/common/TOCFloatingPanel.tsx`
- Create: `src/components/common/__tests__/TOCFloatingPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/common/__tests__/TOCFloatingPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MarkdownProvider } from '../MarkdownContext'
import TOCFloatingPanel from '../TOCFloatingPanel'

function renderPanel(markdown: string) {
  return render(
    <MarkdownProvider markdown={markdown}>
      <TOCFloatingPanel />
    </MarkdownProvider>
  )
}

describe('TOCFloatingPanel', () => {
  it('does not render toggle button when markdown has no headings', () => {
    renderPanel('Just some plain text.')
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('renders toggle button when headings are present', () => {
    renderPanel('# Hello\n## World')
    expect(screen.getByLabelText('Toggle table of contents')).toBeInTheDocument()
  })

  it('does not show panel before toggle button is clicked', () => {
    renderPanel('# Hello')
    expect(screen.queryByText('Contents')).not.toBeInTheDocument()
  })

  it('shows panel with heading entries after toggle button is clicked', () => {
    renderPanel('# Introduction\n## Background')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Contents')).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Background')).toBeInTheDocument()
  })

  it('closes panel when close button is clicked', () => {
    renderPanel('# Hello')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Contents')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close table of contents'))
    expect(screen.queryByText('Contents')).not.toBeInTheDocument()
  })

  it('shows section numbers alongside heading text', () => {
    renderPanel('# First\n## Sub')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('1.1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="TOCFloatingPanel" --no-coverage
```

Expected: FAIL — `Cannot find module '../TOCFloatingPanel'`

- [ ] **Step 3: Create TOCFloatingPanel.tsx**

Create `src/components/common/TOCFloatingPanel.tsx`:

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMarkdownContext } from './MarkdownContext'
import { List, X } from 'lucide-react'

interface TOCFloatingPanelProps {
  position?: { bottom?: string; right?: string }
}

export default function TOCFloatingPanel({
  position = { bottom: '1.5rem', right: '1.5rem' }
}: TOCFloatingPanelProps) {
  const { headings, showTOC, setShowTOC } = useMarkdownContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || headings.length === 0) return null

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setShowTOC(false)
  }

  const indentClass: Record<1 | 2 | 3, string> = {
    1: 'pl-0',
    2: 'pl-4',
    3: 'pl-8',
  }

  const panelBottom = position.bottom
    ? `calc(${position.bottom} + 3.5rem)`
    : '5rem'

  return createPortal(
    <>
      <button
        onClick={() => setShowTOC(!showTOC)}
        style={{ bottom: position.bottom, right: position.right }}
        className="fixed z-50 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle table of contents"
      >
        <List className="h-4 w-4" />
      </button>

      {showTOC && (
        <div
          style={{ bottom: panelBottom, right: position.right }}
          className="fixed z-50 w-60 max-h-96 overflow-y-auto bg-background border border-border rounded-lg shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contents
            </span>
            <button
              onClick={() => setShowTOC(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close table of contents"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <ul className="space-y-1">
            {headings.map(({ id, level, text, sectionNumber }) => (
              <li key={id} className={indentClass[level]}>
                <button
                  onClick={() => handleHeadingClick(id)}
                  className="text-xs text-left w-full text-foreground hover:text-primary transition-colors truncate"
                >
                  <span className="text-muted-foreground mr-1">{sectionNumber}</span>
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>,
    document.body
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="TOCFloatingPanel" --no-coverage
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
cd smoosense-gui && git add src/components/common/TOCFloatingPanel.tsx src/components/common/__tests__/TOCFloatingPanel.test.tsx
git commit -m "feat: add TOCFloatingPanel with fixed-position toggle and portal-rendered panel"
```

---

## Task 4: Update CustomMarkdown — wire all features together

**Files:**
- Modify: `src/components/common/CustomMarkdown.tsx`
- Create: `src/components/common/__tests__/CustomMarkdown.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/common/__tests__/CustomMarkdown.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createTestStore } from '@/lib/test-utils'
import CustomMarkdown from '../CustomMarkdown'

// react-markdown is mocked (returns children as-is), so custom component
// handlers won't be invoked. Tests cover the context wiring and TOC behavior.

const store = createTestStore()

function renderMd(content: string, props: Partial<{ disableTOC: boolean }> = {}) {
  return render(
    <Provider store={store}>
      <CustomMarkdown {...props}>{content}</CustomMarkdown>
    </Provider>
  )
}

describe('CustomMarkdown', () => {
  it('renders without errors for plain text', () => {
    renderMd('Hello world')
    expect(document.body).toBeInTheDocument()
  })

  it('shows TOC toggle button when headings are present', () => {
    renderMd('# Introduction\n## Background')
    expect(screen.getByLabelText('Toggle table of contents')).toBeInTheDocument()
  })

  it('does not show TOC button when disableTOC is true', () => {
    renderMd('# Introduction', { disableTOC: true })
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('does not show TOC button when no headings in markdown', () => {
    renderMd('Just some text without headings.')
    expect(screen.queryByLabelText('Toggle table of contents')).not.toBeInTheDocument()
  })

  it('opens TOC panel and shows heading entries when toggle is clicked', () => {
    renderMd('# Hello\n## World')
    fireEvent.click(screen.getByLabelText('Toggle table of contents'))
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd smoosense-gui && pnpm test -- --testPathPattern="CustomMarkdown.test" --no-coverage
```

Expected: FAIL (the test file doesn't exist yet; also the TOC wiring doesn't exist yet)

- [ ] **Step 3: Replace CustomMarkdown.tsx**

Replace the full content of `src/components/common/CustomMarkdown.tsx`:

```tsx
'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Components } from 'react-markdown'
import Link from 'next/link'
import FileShortcut from './FileShortcut'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import { CLS } from '@/lib/utils/styles'
import { MarkdownProvider, useMarkdownContext } from './MarkdownContext'
import TOCFloatingPanel from './TOCFloatingPanel'
import MarkdownAGTable from './MarkdownAGTable'
import InteractiveMermaid from './InteractiveMermaid'

interface CustomMarkdownProps {
  children: string
  disableTOC?: boolean
  tocButtonPosition?: { bottom?: string; right?: string }
}

interface HastNode {
  type: string
  tagName?: string
  children?: HastNode[]
  value?: string
}

function HeadingWithCounter({
  level,
  children,
}: {
  level: 1 | 2 | 3
  children: React.ReactNode
}) {
  const { headings, headingIndexRef } = useMarkdownContext()
  const index = headingIndexRef.current++
  const entry = headings[index]

  const sizeClass = {
    1: 'text-2xl font-bold mb-4',
    2: 'text-xl font-semibold mb-3',
    3: 'text-lg font-medium mb-2',
  }[level]

  const Tag = `h${level}` as 'h1' | 'h2' | 'h3'

  return (
    <Tag id={entry?.id} className={`${sizeClass} text-foreground`}>
      {entry && (
        <span className="text-muted-foreground text-[0.85em] mr-2">{entry.sectionNumber}</span>
      )}
      {children}
    </Tag>
  )
}

interface MarkdownInnerProps {
  markdown: string
  disableTOC?: boolean
  tocButtonPosition?: { bottom?: string; right?: string }
}

function MarkdownInner({ markdown, disableTOC, tocButtonPosition }: MarkdownInnerProps) {
  const components: Components = {
    h1: ({ children }) => <HeadingWithCounter level={1}>{children}</HeadingWithCounter>,
    h2: ({ children }) => <HeadingWithCounter level={2}>{children}</HeadingWithCounter>,
    h3: ({ children }) => <HeadingWithCounter level={3}>{children}</HeadingWithCounter>,
    p: ({ children, node }) => {
      if (node && node.children && node.children.length === 1) {
        const child = node.children[0]
        if (child.type === 'element') {
          return <>{children}</>
        }
      }
      return <p className="text-foreground mb-3 leading-relaxed">{children}</p>
    },
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-3 text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-3 text-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,
    code: ({ children, className, ...props }) => {
      if (className?.includes('language-mermaid')) {
        return <InteractiveMermaid definition={String(children).trim()} />
      }
      return (
        <code
          className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-attention"
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children }) => <pre className="mt-2 mb-5">{children}</pre>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-border" />,
    a: ({ href, children, ...props }) => {
      if (!href) {
        return <span className="text-foreground">{children}</span>
      }
      const isInternal =
        href.startsWith('/') ||
        (!href.startsWith('http') && !href.startsWith('mailto:'))
      const linkClasses = `${CLS.HYPERLINK} break-words`
      if (isInternal) {
        return (
          <Link href={href} className={linkClasses} {...props}>
            {children}
          </Link>
        )
      }
      return (
        <a
          href={href}
          className={linkClasses}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },
    table: ({ node, children }) => (
      <MarkdownAGTable node={node as unknown as HastNode}>{children}</MarkdownAGTable>
    ),
    fileshortcut: ({ ...props }: Record<string, string>) => (
      <FileShortcut tablePath={props['filepath'] || ''} description={props['description'] || ''} />
    ),
    headerstatscellrendererimpl: ({ ...props }: Record<string, string>) => {
      const columnname = props['columnname'] || ''
      const side = (props['side'] || 'right') as 'top' | 'right' | 'bottom' | 'left'
      const showColumnName = props['showcolumnname'] === 'true'
      if (!columnname) {
        return (
          <div className="text-sm text-muted-foreground">Column name required</div>
        )
      }
      return (
        <div className="inline-block w-full h-12 border border-border rounded">
          <HeaderStatsCellRendererImpl
            columnName={columnname}
            side={side}
            showColumnName={showColumnName}
          />
        </div>
      )
    },
  } as Components & {
    fileshortcut: React.ComponentType<Record<string, string>>
    headerstatscellrendererimpl: React.ComponentType<Record<string, string>>
  }

  return (
    <>
      {!disableTOC && <TOCFloatingPanel position={tocButtonPosition} />}
      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={components}>
        {markdown}
      </ReactMarkdown>
    </>
  )
}

export default function CustomMarkdown({
  children,
  disableTOC = false,
  tocButtonPosition,
}: CustomMarkdownProps) {
  return (
    <MarkdownProvider markdown={children}>
      <MarkdownInner
        markdown={children}
        disableTOC={disableTOC}
        tocButtonPosition={tocButtonPosition}
      />
    </MarkdownProvider>
  )
}
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
cd smoosense-gui && pnpm test -- --no-coverage
```

Expected: PASS for all tests including `CustomMarkdown.test`, `MarkdownContext.test`, `MarkdownAGTable.test`, `TOCFloatingPanel.test`, and all previously passing tests.

- [ ] **Step 5: Commit**

```bash
cd smoosense-gui && git add src/components/common/CustomMarkdown.tsx src/components/common/__tests__/CustomMarkdown.test.tsx
git commit -m "feat: wire mermaid, AG Grid tables, section counters, and floating TOC into CustomMarkdown"
```

---

## Verification

After all tasks complete, manually verify in the running app (`make dev` from repo root):

1. Open a view that renders `CustomMarkdown` (e.g., the AI assistant popover)
2. Send a message that returns markdown with headings — confirm section numbers appear on headings
3. Click the floating TOC button (bottom-right) — confirm panel opens with heading list
4. Click a heading in the TOC — confirm smooth scroll and panel closes
5. Add a ` ```mermaid ` block — confirm diagram renders
6. Add a markdown table — confirm AG Grid renders with capped height
