'use client'

import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { useTextContent } from '@/lib/hooks/useTextContent'
import ReadonlyCodeMirror from '@/components/common/ReadonlyCodeMirror'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'
import PreviewNotFound from './shared/PreviewNotFound'
import { yaml } from '@codemirror/lang-yaml'

interface YamlPreviewerProps {
  item: TreeNode
  version?: number
}

export default function YamlPreviewer({ item, version = 0 }: YamlPreviewerProps) {
  const { content, isLoading, error, fileExists } = useTextContent({
    itemId: item.id,
    version
  })

  const renderContent = () => {
    if (isLoading) {
      return <PreviewLoading message="Loading YAML content..." />
    }

    if (error) {
      return <PreviewError title="Error loading file" message={error} />
    }

    if (fileExists === false) {
      return <PreviewNotFound />
    }

    return (
      <ReadonlyCodeMirror
        value={content || '(Empty file)'}
        extensions={[yaml()]}
        height="100%"
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-auto min-h-0">
      {renderContent()}
    </div>
  )
}
