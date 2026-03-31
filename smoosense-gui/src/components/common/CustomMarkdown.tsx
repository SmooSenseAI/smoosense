'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { Components } from 'react-markdown'
import Link from 'next/link'
import FileShortcut from './FileShortcut'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import { CLS } from '@/lib/utils/styles'
import { MarkdownProvider, useMarkdownContext } from './MarkdownContext'
import TOCFloatingPanel from './TOCFloatingPanel'
import InteractiveMermaid from './InteractiveMermaid'

interface CustomMarkdownProps {
  children: string
  disableTOC?: boolean
  tocButtonPosition?: { bottom?: string; right?: string }
  /** When true, skips creating a MarkdownProvider (caller must provide one) */
  noProvider?: boolean
}

function HeadingWithCounter({
  level,
  children,
}: {
  level: 1 | 2 | 3
  children: React.ReactNode
}) {
  const { headings, headingIndexRef } = useMarkdownContext()
  // Per-instance ref so the index is claimed exactly once per mount,
  // making it idempotent across React StrictMode's double render invocation.
  const myIndexRef = React.useRef<number | null>(null)
  if (myIndexRef.current === null) {
    myIndexRef.current = headingIndexRef.current
    headingIndexRef.current += 1
  }
  const entry = headings[myIndexRef.current]

  const sizeClass = {
    1: 'text-2xl font-bold mb-4',
    2: 'text-xl font-semibold mb-3',
    3: 'text-lg font-medium mb-2',
  }[level]

  const Tag = `h${level}` as 'h1' | 'h2' | 'h3'

  return (
    <Tag id={entry?.id} className={`${sizeClass} text-foreground`}>
      {entry?.sectionNumber && (
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
      <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground mb-3">
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
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-semibold text-foreground border border-border">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-foreground border border-border">{children}</td>
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {markdown}
      </ReactMarkdown>
    </>
  )
}

export default function CustomMarkdown({
  children,
  disableTOC = false,
  tocButtonPosition,
  noProvider = false,
}: CustomMarkdownProps) {
  if (noProvider) {
    return (
      <MarkdownInner markdown={children} disableTOC={disableTOC} tocButtonPosition={tocButtonPosition} />
    )
  }
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
