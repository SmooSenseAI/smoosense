'use client'

import { Extension } from '@codemirror/state'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from 'next-themes'

interface ReadonlyCodeMirrorProps {
  value: string
  extensions?: Extension[]
  height?: string
}

/**
 * A read-only CodeMirror component optimized for file preview.
 * Provides consistent styling, theme support, and minimal interactive features.
 */
export default function ReadonlyCodeMirror({ 
  value, 
  extensions = [], 
  height = "100vh" 
}: ReadonlyCodeMirrorProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

  return (
    <div className="flex-1 overflow-auto rounded-md">
      <CodeMirror
        value={value}
        extensions={extensions}
        theme={isDark ? oneDark : 'light'}
        height={height}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          searchKeymap: false,
          autocompletion: false,
          bracketMatching: true,
          dropCursor: false,
          indentOnInput: false,
        }}
      />
    </div>
  )
}