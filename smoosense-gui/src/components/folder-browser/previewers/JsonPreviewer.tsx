'use client'

import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { useTextContent } from '@/lib/hooks/useTextContent'
import JsonBox from '@/components/ui/JsonBox'
import ReadonlyCodeMirror from '@/components/common/ReadonlyCodeMirror'
import { useMemo } from 'react'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'

interface JsonPreviewerProps {
  item: TreeNode
  version?: number
}

export default function JsonPreviewer({ item, version = 0 }: JsonPreviewerProps) {
  const { content, isLoading, error, fileExists } = useTextContent({ 
    itemId: item.id, 
    version 
  })

  // Parse JSON content
  const jsonData = useMemo(() => {
    if (!content.trim()) return null
    
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }, [content])

  const renderContent = () => {
    if (isLoading) {
      return <PreviewLoading message="Loading JSON content..." />
    }

    if (error) {
      return <PreviewError title="Error loading file" message={error} />
    }

    if (fileExists === false) {
      return <PreviewNotFound />
    }

    if (!content.trim()) {
      return (
        <PreviewError 
          title="Empty file" 
          message="The file is empty or contains only whitespace." 
        />
      )
    }

    if (!jsonData) {
      return (
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0">
            <PreviewError 
              title="Invalid JSON" 
              message="The file content is not valid JSON. Displaying as plain text." 
            />
          </div>
          <div className="flex-1 min-h-0 mt-4">
            <ReadonlyCodeMirror
              value={content}
              extensions={[]} // No syntax highlighting for invalid JSON
            />
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1">
        <JsonBox src={jsonData} showControls={true} className="h-full" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {renderContent()}
    </div>
  )
}