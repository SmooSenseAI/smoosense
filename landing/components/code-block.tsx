'use client'

import { Box, IconButton, useClipboard } from '@chakra-ui/react'
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FiCheck, FiCopy } from 'react-icons/fi'

interface CodeBlockProps {
  children: string
  language?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'bash' }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { hasCopied, onCopy } = useClipboard(children.trim())

  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      mb={4}
    >
      <IconButton
        aria-label="Copy code"
        icon={hasCopied ? <FiCheck /> : <FiCopy />}
        size="sm"
        position="absolute"
        top={2}
        right={2}
        opacity={isHovered ? 1 : 0}
        transition="opacity 0.2s"
        onClick={onCopy}
        colorScheme={hasCopied ? 'green' : 'gray'}
        zIndex={1}
      />
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          padding: '1rem',
          maxHeight: '250px',
          overflow: 'auto',
        }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </Box>
  )
}
