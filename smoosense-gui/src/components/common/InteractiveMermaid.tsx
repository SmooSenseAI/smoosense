'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface InteractiveMermaidProps {
  definition: string
  className?: string
}

export default function InteractiveMermaid({ 
  definition, 
  className = "w-full h-full"
}: InteractiveMermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

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
        const { svg } = await mermaid.render('mermaid-graph', definition)
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
        console.error('Error rendering mermaid diagram:', error)
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '<div class="p-4 text-red-500">Error rendering diagram</div>'
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