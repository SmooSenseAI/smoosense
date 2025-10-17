'use client'

import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { useTextContent } from '@/lib/hooks/useTextContent'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'
import ReadonlyCodeMirror from '@/components/common/ReadonlyCodeMirror'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { sql } from '@codemirror/lang-sql'
import { markdown } from '@codemirror/lang-markdown'

interface TextPreviewerProps {
  item: TreeNode
  version?: number
}

export default function TextPreviewer({ item, version = 0 }: TextPreviewerProps) {
  const { content, isLoading, error, fileExists } = useTextContent({ 
    itemId: item.id, 
    version 
  })
  
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

    // Use ReadonlyCodeMirror for all files, with or without syntax highlighting
    const extensions = isCodeFile && languageConfig ? [languageConfig.extension] : []
    
    return (
      <ReadonlyCodeMirror
        value={content || '(Empty file)'}
        extensions={extensions}
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {renderContent()}
    </div>
  )
}