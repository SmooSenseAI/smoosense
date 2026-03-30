'use client'

import React, { createContext, useContext, useMemo, useRef, useState } from 'react'

export interface HeadingEntry {
  id: string
  level: 1 | 2 | 3
  text: string
  sectionNumber: string
}

export interface MarkdownContextValue {
  headings: HeadingEntry[]
  showTOC: boolean
  setShowTOC: (v: boolean) => void
  headingIndexRef: React.MutableRefObject<number>
}

const MarkdownContext = createContext<MarkdownContextValue | null>(null)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function computeHeadings(markdown: string): HeadingEntry[] {
  // Strip fenced code blocks then inline code to avoid false heading matches
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')

  const headingRegex = /^(#{1,3})[ \t]+(.+)$/gm
  const counters: [number, number, number] = [0, 0, 0]
  const slugCounts: Record<string, number> = {}
  const result: HeadingEntry[] = []

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length as 1 | 2 | 3
    const text = match[2].trim()

    counters[level - 1]++
    for (let i = level; i < 3; i++) counters[i] = 0

    const sectionNumber = counters.slice(0, level).join('.')

    const baseSlug = slugify(text)
    const count = slugCounts[baseSlug] ?? 0
    slugCounts[baseSlug] = count + 1
    const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

    result.push({ id, level, text, sectionNumber })
  }

  return result
}

interface MarkdownProviderProps {
  children: React.ReactNode
  markdown: string
}

export function MarkdownProvider({ children, markdown }: MarkdownProviderProps) {
  const [showTOC, setShowTOC] = useState(false)
  const headingIndexRef = useRef(0)
  const headings = useMemo(() => computeHeadings(markdown), [markdown])

  // Reset heading index before each render so h1/h2/h3 components claim entries in order
  headingIndexRef.current = 0

  return (
    <MarkdownContext.Provider value={{ headings, showTOC, setShowTOC, headingIndexRef }}>
      {children}
    </MarkdownContext.Provider>
  )
}

export function useMarkdownContext(): MarkdownContextValue {
  const ctx = useContext(MarkdownContext)
  if (!ctx) throw new Error('useMarkdownContext must be used within MarkdownProvider')
  return ctx
}
