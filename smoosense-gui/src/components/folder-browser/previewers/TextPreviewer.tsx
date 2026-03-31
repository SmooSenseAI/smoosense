'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { useTextContent } from '@/lib/hooks/useTextContent'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'
import ReadonlyCodeMirror from '@/components/common/ReadonlyCodeMirror'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import { MarkdownProvider, useMarkdownContext } from '@/components/common/MarkdownContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Code, Eye, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { sql } from '@codemirror/lang-sql'
import { markdown } from '@codemirror/lang-markdown'

interface TextPreviewerProps {
  item: TreeNode
  version?: number
}

function TOCPopover() {
  const { headings, showTOC, setShowTOC } = useMarkdownContext()
  if (headings.length === 0) return null

  const indentClass: Record<1 | 2 | 3, string> = { 1: 'pl-0', 2: 'pl-4', 3: 'pl-8' }

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setShowTOC(false)
  }

  return (
    <Popover open={showTOC} onOpenChange={setShowTOC}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <List className="h-4 w-4" />
          Table of contents
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 max-h-96 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Contents
          </span>
        </div>
        <ul className="space-y-1">
          {headings.map(({ id, level, text, sectionNumber }) => (
            <li key={id} className={indentClass[level as 1 | 2 | 3]}>
              <button
                onClick={() => handleHeadingClick(id)}
                className="text-xs text-left w-full text-foreground hover:text-primary transition-colors truncate cursor-pointer"
              >
                <span className="text-muted-foreground mr-1">{sectionNumber}</span>
                {text}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export default function TextPreviewer({ item, version = 0 }: TextPreviewerProps) {
  const [showRendered, setShowRendered] = useState(true)
  const [headerPortal, setHeaderPortal] = useState<Element | null>(null)
  const { content, isLoading, error, fileExists } = useTextContent({
    itemId: item.id,
    version
  })

  useEffect(() => {
    setHeaderPortal(document.getElementById('fs-preview-header-controls'))
  }, [item.id])

  // Determine file type and language extension
  const fileName = item.name.toLowerCase()
  const getLanguageConfig = () => {
    if (fileName.endsWith('.py')) {
      return { extension: python(), previewType: 'Python Code Preview' }
    } else if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
      return { extension: javascript(), previewType: 'JavaScript Code Preview' }
    } else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      return { extension: javascript({ typescript: true }), previewType: 'TypeScript Code Preview' }
    } else if (fileName.endsWith('.sql')) {
      return { extension: sql(), previewType: 'SQL Code Preview' }
    } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      return { extension: markdown(), previewType: 'Markdown Preview' }
    }
    return null
  }

  const languageConfig = getLanguageConfig()
  const isCodeFile = languageConfig !== null
  const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown')

  const renderContent = () => {
    if (isLoading) {
      return <PreviewLoading />
    }

    if (error) {
      return <PreviewError title="Error loading file" message={error} />
    }

    if (fileExists === false) {
      return <PreviewNotFound />
    }

    // For markdown files, show either rendered or source based on toggle
    if (isMarkdown && showRendered) {
      return (
        <div className="w-full h-full overflow-auto p-6">
          <div className="markdown-content max-w-4xl">
            <CustomMarkdown noProvider disableTOC>{content || '(Empty file)'}</CustomMarkdown>
          </div>
        </div>
      )
    }

    // Use ReadonlyCodeMirror for source view or non-markdown files
    const extensions = isCodeFile && languageConfig ? [languageConfig.extension] : []

    return (
      <ReadonlyCodeMirror
        value={content || '(Empty file)'}
        extensions={extensions}
      />
    )
  }

  const showControls = isMarkdown && !isLoading && !error && fileExists !== false

  return (
    <MarkdownProvider markdown={isMarkdown ? (content || '') : ''}>
      <div className="w-full h-full">
        {renderContent()}
      </div>
      {showControls && headerPortal && createPortal(
        <div className="flex items-center gap-1.5">
          {showRendered && <TOCPopover />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRendered(!showRendered)}
            className="gap-2"
          >
            {showRendered ? (
              <><Code className="h-4 w-4" />Show source</>
            ) : (
              <><Eye className="h-4 w-4" />See rendered</>
            )}
          </Button>
        </div>,
        headerPortal
      )}
    </MarkdownProvider>
  )
}
