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
    <div className="flex-1 overflow-hidden">
      <CodeMirror
        value={value}
        extensions={extensions}
        theme={isDark ? oneDark : 'light'}
        height={height}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
          searchKeymap: false,
          autocompletion: false,
          bracketMatching: false,
          dropCursor: false,
          indentOnInput: false,
        }}
      />
    </div>
  )
}