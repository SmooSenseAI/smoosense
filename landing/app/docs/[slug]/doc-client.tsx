'use client'

import { Box } from '@chakra-ui/react'
import { useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { FallInPlace } from '#components/motion/fall-in-place'
import { createHeaderMap, createMarkdownComponents } from '#components/markdown-components'
import 'katex/dist/katex.min.css'

export function DocClient({ content }: { content: string }) {
  useEffect(() => {
    // Extract title for browser tab
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      document.title = `${titleMatch[1]} - SmooSense`
    }
  }, [content])

  // Extract and replace variables from markdown
  const processedContent = useMemo(() => {
    const variables: Record<string, string> = {}

    // Extract variable definitions from HTML comments: <!-- $VAR_NAME = value -->
    const variableRegex = /<!--\s*\$(\w+)\s*=\s*(.+?)\s*-->/g
    let match
    while ((match = variableRegex.exec(content)) !== null) {
      variables[match[1]] = match[2]
    }

    // Remove variable definitions from content
    let processed = content.replace(variableRegex, '')

    // Replace variable references: ${VAR_NAME}
    for (const [key, value] of Object.entries(variables)) {
      const varRegex = new RegExp(`\\$\\{${key}\\}`, 'g')
      processed = processed.replace(varRegex, value)
    }

    return processed
  }, [content])

  // Pre-calculate header numbers from content to avoid double-counting in strict mode
  const headerMap = useMemo(() => createHeaderMap(processedContent), [processedContent])
  const components = useMemo(() => createMarkdownComponents(headerMap), [headerMap])

  return (
    <Box
      bg="whiteAlpha.50"
      _dark={{ bg: 'whiteAlpha.50' }}
      borderRadius="xl"
      p={8}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  )
}
