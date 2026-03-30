'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

let mermaidIdCounter = 0

interface InteractiveMermaidProps {
  definition: string
  className?: string
}

export default function InteractiveMermaid({
  definition,
  className = "w-full h-full"
}: InteractiveMermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const mermaidId = useRef(`mermaid-graph-${++mermaidIdCounter}`)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 10 },
      themeVariables: { fontSize: '14px' }
    })
  }, [])

  useEffect(() => {
    if (!mermaidRef.current) return

    const renderMermaid = async () => {
      if (!mermaidRef.current) return

      try {
        mermaidRef.current.innerHTML = ''
        const { svg } = await mermaid.render(mermaidId.current, definition)
        mermaidRef.current.innerHTML = svg

        const svgElement = mermaidRef.current.querySelector('svg')
        if (svgElement) {
          Object.assign(svgElement.style, {
            width: '100%',
            height: 'auto',
            maxWidth: '600px',
            maxHeight: '400px',
            display: 'block',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)'
          })
          
          const applyStyles = (selector: string, styles: Partial<CSSStyleDeclaration>) => {
            svgElement.querySelectorAll(selector).forEach(el => 
              Object.assign((el as HTMLElement).style, styles)
            )
          }
          
          applyStyles('.node', { fill: 'var(--muted)', stroke: 'var(--foreground)', strokeWidth: '2px' })
          applyStyles('text, .label', { fontSize: '0.875rem', fontFamily: 'var(--font-sans)', fill: 'var(--foreground)' })
          applyStyles('path', { stroke: 'var(--muted-foreground)', strokeWidth: '2px' })
          applyStyles('marker', { fill: 'var(--muted-foreground)' })
          applyStyles('polyline', { stroke: 'var(--muted-foreground)', strokeWidth: '2px', fill: 'none' })
        }
      } catch (error) {
        if (mermaidRef.current) {
          const message = error instanceof Error ? error.message : String(error)
          mermaidRef.current.innerHTML = `<pre class="p-3 text-xs text-red-500 whitespace-pre-wrap border border-red-200 rounded bg-red-50 dark:bg-red-950/20">${message}</pre>`
        }
      }
    }

    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [definition])


  return (
    <div className={className}>
      <div ref={mermaidRef} className="w-full h-full text-sm font-sans" />
    </div>
  )
}