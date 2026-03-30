'use client'

import React from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'

interface HastNode {
  type: string
  value?: string
  tagName?: string
  children?: HastNode[]
}

interface MarkdownAGTableProps {
  node?: HastNode
  children?: React.ReactNode
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

function parseTableData(node: HastNode): { rows: Record<string, unknown>[] } | null {
  if (!node.children) return null

  const thead = node.children.find(c => c.tagName === 'thead')
  const tbody = node.children.find(c => c.tagName === 'tbody')
  if (!thead || !tbody) return null

  const headerRow = thead.children?.find(c => c.tagName === 'tr')
  if (!headerRow?.children) return null

  const columns = headerRow.children
    .filter(c => c.tagName === 'th')
    .map(th => getTextContent(th))

  if (columns.length === 0) return null

  const rows = (tbody.children ?? [])
    .filter(c => c.tagName === 'tr')
    .map(tr => {
      const cells = (tr.children ?? [])
        .filter(c => c.tagName === 'td')
        .map(td => getTextContent(td))
      return Object.fromEntries(columns.map((col, i) => [col, cells[i] ?? '']))
    })

  return { rows }
}

export default function MarkdownAGTable({ node, children }: MarkdownAGTableProps) {
  if (!node) return <table>{children}</table>

  const parsed = parseTableData(node)
  if (!parsed) return <table>{children}</table>

  return (
    <div style={{ minHeight: '80px', maxHeight: '300px', overflowY: 'auto' }} className="my-3">
      <BasicAGTable
        data={parsed.rows}
        gridOptionOverrides={{ domLayout: 'autoHeight' }}
      />
    </div>
  )
}
