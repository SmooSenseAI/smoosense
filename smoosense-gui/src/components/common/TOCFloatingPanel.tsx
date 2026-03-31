'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMarkdownContext } from './MarkdownContext'
import { List, X } from 'lucide-react'

interface TOCFloatingPanelProps {
  position?: { bottom?: string; right?: string }
  showButton?: boolean
}

export default function TOCFloatingPanel({
  position = { bottom: '1.5rem', right: '1.5rem' },
  showButton = true,
}: TOCFloatingPanelProps) {
  const { headings, showTOC, setShowTOC } = useMarkdownContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || headings.length === 0) return null

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setShowTOC(false)
  }

  const indentClass: Record<1 | 2 | 3, string> = {
    1: 'pl-0',
    2: 'pl-4',
    3: 'pl-8',
  }

  const panelBottom = position.bottom
    ? `calc(${position.bottom} + 3.5rem)`
    : '5rem'

  return createPortal(
    <>
      {showButton && (
        <button
          onClick={() => setShowTOC(!showTOC)}
          style={{ bottom: position.bottom, right: position.right }}
          className="fixed z-50 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Toggle table of contents"
        >
          <List className="h-4 w-4" />
        </button>
      )}

      {showTOC && (
        <div
          style={{ bottom: panelBottom, right: position.right }}
          className="fixed z-50 w-60 max-h-96 overflow-y-auto bg-background border border-border rounded-lg shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contents
            </span>
            <button
              onClick={() => setShowTOC(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close table of contents"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <ul className="space-y-1">
            {headings.map(({ id, level, text, sectionNumber }) => (
              <li key={id} className={indentClass[level]}>
                <button
                  onClick={() => handleHeadingClick(id)}
                  className="text-xs text-left w-full text-foreground hover:text-primary transition-colors truncate cursor-pointer"
                >
                  <span className="text-primary mr-1">{sectionNumber}</span>
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>,
    document.body
  )
}
