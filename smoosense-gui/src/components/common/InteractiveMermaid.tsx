'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Expand, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CLS } from '@/lib/utils/styles'

let mermaidIdCounter = 0

interface InteractiveMermaidProps {
  definition: string
  className?: string
  /** Internal: when true, removes size caps and hides the expand button */
  expanded?: boolean
}

export default function InteractiveMermaid({
  definition,
  className = 'w-full h-full',
  expanded = false,
}: InteractiveMermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const mermaidId = useRef(`mermaid-graph-${++mermaidIdCounter}`)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 10 },
      themeVariables: { fontSize: '14px' },
    })
  }, [])

  useEffect(() => {
    if (!mermaidRef.current) return

    const renderMermaid = async () => {
      if (!mermaidRef.current) return

      try {
        mermaidRef.current.innerHTML = ''
        const sanitized = definition.replace(/\\n/g, '<br>')
        const { svg } = await mermaid.render(mermaidId.current, sanitized)
        mermaidRef.current.innerHTML = svg

        const svgElement = mermaidRef.current.querySelector('svg')
        if (svgElement) {
          Object.assign(svgElement.style, {
            width: '100%',
            height: 'auto',
            ...(expanded ? {} : { maxWidth: '600px', maxHeight: '400px' }),
            display: 'block',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
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
  }, [definition, expanded])

  return (
    <div className={`${className} relative group`}>
      <div ref={mermaidRef} className="w-full h-full text-sm font-sans" />

      {!expanded && (
        <>
          <button
            aria-label="Expand chart"
            onClick={() => setIsDialogOpen(true)}
            className={`${CLS.ICON_BUTTON_SM} absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <Expand className="h-4 w-4" />
          </button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent
              className="max-w-none p-0 flex flex-col"
              style={{ width: '90vw', height: '90vh' }}
              aria-describedby={undefined}
            >
              <DialogHeader className="p-4 pb-2 flex-shrink-0">
                <DialogTitle className="flex items-center justify-between">
                  <span>Chart</span>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className={CLS.ICON_BUTTON_SM}
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-4">
                {isDialogOpen && (
                  <InteractiveMermaid
                    definition={definition}
                    className="w-full"
                    expanded
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
