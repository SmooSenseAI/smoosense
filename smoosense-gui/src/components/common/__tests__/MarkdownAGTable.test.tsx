import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createTestStore } from '@/lib/test-utils'
import MarkdownAGTable from '../MarkdownAGTable'

// ag-grid-react is mocked in jest.config.js → renders <div data-testid="ag-grid-mock">
jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ columnDefs }: { columnDefs: { field?: string }[] }) => (
    <div data-testid="ag-grid-mock">
      {columnDefs?.map((col, i) => (
        <div key={i} data-testid={`column-${col.field}`} />
      ))}
    </div>
  )
}))

const store = createTestStore()

function makeTableNode(columns: string[], rows: string[][]) {
  return {
    type: 'element',
    tagName: 'table',
    children: [
      {
        type: 'element',
        tagName: 'thead',
        children: [{
          type: 'element',
          tagName: 'tr',
          children: columns.map(col => ({
            type: 'element',
            tagName: 'th',
            children: [{ type: 'text', value: col }]
          }))
        }]
      },
      {
        type: 'element',
        tagName: 'tbody',
        children: rows.map(row => ({
          type: 'element',
          tagName: 'tr',
          children: row.map(cell => ({
            type: 'element',
            tagName: 'td',
            children: [{ type: 'text', value: cell }]
          }))
        }))
      }
    ]
  }
}

describe('MarkdownAGTable', () => {
  it('renders AG Grid when a valid table node is provided', () => {
    const node = makeTableNode(['Name', 'Age'], [['John', '30'], ['Jane', '25']])
    render(
      <Provider store={store}>
        <MarkdownAGTable node={node} />
      </Provider>
    )
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).toBeInTheDocument()
  })

  it('falls back to plain <table> when no node is provided', () => {
    const { container } = render(
      <Provider store={store}>
        <MarkdownAGTable>
          <tbody><tr><td>fallback</td></tr></tbody>
        </MarkdownAGTable>
      </Provider>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).not.toBeInTheDocument()
  })

  it('falls back to plain <table> when thead is missing', () => {
    const node = {
      type: 'element',
      tagName: 'table',
      children: [{
        type: 'element',
        tagName: 'tbody',
        children: [{ type: 'element', tagName: 'tr', children: [] }]
      }]
    }
    const { container } = render(
      <Provider store={store}>
        <MarkdownAGTable node={node} />
      </Provider>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
  })
})
