import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Components } from 'react-markdown'
import Link from 'next/link'
import FileShortcut from './FileShortcut'
import { HeaderStatsCellRendererImpl } from '@/lib/utils/cellRenderers/HeaderStatsCellRenderer'
import { CLS } from '@/lib/utils/styles'

interface CustomMarkdownProps {
  children: string
}

export default function CustomMarkdown({ children }: CustomMarkdownProps) {
  const components: Components = {
    // Default HTML element styling
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium mb-2 text-foreground">{children}</h3>
    ),
    p: ({ children, node }) => {
      // Check if this paragraph contains only HTML elements (like our custom components)
      // If the node has only one child and it's an element (not text), don't wrap in <p>
      if (node && node.children && node.children.length === 1) {
        const child = node.children[0]
        if (child.type === 'element') {
          // Return the children directly without <p> wrapper
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
    li: ({ children }) => (
      <li className="mb-1">{children}</li>
    ),
    code: ({ children, ...props }) => {
        return (
          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-attention" {...props}>
            {children}
          </code>
        )
    },
    pre: ({ children }) => (
      <pre className="mt-2 mb-5">{children}</pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-4 border-border" />
    ),
    a: ({ href, children, ...props }) => {
      if (!href) {
        return <span className="text-foreground">{children}</span>
      }

      // Check if it's an internal link (starts with / or relative)
      const isInternal = href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('mailto:'))

      // Common styling classes using centralized styles
      const linkClasses = `${CLS.HYPERLINK} break-words`

      if (isInternal) {
        return (
          <Link href={href} className={linkClasses} {...props}>
            {children}
          </Link>
        )
      }

      // External links
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
    // Custom component mapping - using lowercase to match HTML tag
    fileshortcut: ({ ...props }: Record<string, string>) => {
      const filePath = props['filepath'] || ''
      const description = props['description'] || ''

      return <FileShortcut filePath={filePath} description={description} />
    },
    headerstatscellrendererimpl: ({ ...props }: Record<string, string>) => {
      const columnname = props['columnname'] || ''
      const side = (props['side'] || 'right') as 'top' | 'right' | 'bottom' | 'left'
      const showColumnName = props['showcolumnname'] === 'true'

      if (!columnname) {
        return <div className="text-sm text-muted-foreground">Column name required</div>
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
    fileshortcut: React.ComponentType<Record<string, string>>;
    headerstatscellrendererimpl: React.ComponentType<Record<string, string>>;
  }

  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}