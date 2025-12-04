'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { useMemo } from 'react'
import { createHeaderMap, createMarkdownComponents } from './markdown-components'

export default function TabContent({ content }: { content: string }) {
  const headerMap = useMemo(() => createHeaderMap(content), [content])
  const components = useMemo(() => createMarkdownComponents(headerMap), [headerMap])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={components}
    >
      {content.trim()}
    </ReactMarkdown>
  )
}
