import { render, screen } from '@testing-library/react'
import ColumnMetadataDebugger from '../ColumnMetadataDebugger'
import { createTestStore } from '@/lib/test-utils'
import { Provider } from 'react-redux'
import type { ColumnMeta } from '@/lib/api/queries'

// Mock IconDialog to avoid portal issues in tests
jest.mock('@/components/common/IconDialog', () => {
  return function MockIconDialog({ children, title }: { children: React.ReactNode, title: string }) {
    return (
      <div data-testid="icon-dialog">
        <h2>{title}</h2>
        {children}
      </div>
    )
  }
})

// Mock BasicAGTable to capture the props
jest.mock('@/components/common/BasicAGTable', () => {
  return function MockBasicAGTable({ data, colDefOverrides }: { data: Record<string, unknown>[], colDefOverrides?: Record<string, unknown> }) {
    return (
      <div data-testid="basic-ag-table">
        <div data-testid="row-count">{data.length}</div>
        <div data-testid="col-overrides">{JSON.stringify(colDefOverrides)}</div>
        {data.map((row, i) => (
          <div key={i} data-testid={`row-${i}`}>
            {JSON.stringify(row)}
          </div>
        ))}
      </div>
    )
  }
})

describe('ColumnMetadataDebugger', () => {
  const mockColumns: ColumnMeta[] = [
    {
      column_name: 'test_col',
      duckdbType: 'BOOLEAN',
      typeShortcuts: {
        isInteger: false,
        isFloat: false,
        isNumeric: false,
        isBoolean: true,
        isString: false,
        isPrimitive: true,
        agType: 'boolean',
        isDatetime: false,
        isNumericArray: false
      },
      stats: {
        min: null,
        max: null,
        cntAll: 100,
        cntNull: 0,
        hasNull: false,
        singleValue: false,
        allNull: false
      }
    }
  ]

  it('should render with column metadata and cardinality data', () => {
    const store = createTestStore({
      columns: {
        cardinality: {
          'test_col': {
            data: {
              approxCntD: 2,
              cntD: 2,
              distinctRatio: null,
              cardinality: 'low',
              source: 'from metadata'
            },
            loading: false,
            error: null
          }
        },
        baseStats: {}
      }
    })

    render(
      <Provider store={store}>
        <ColumnMetadataDebugger columns={mockColumns} />
      </Provider>
    )

    // Check that dialog renders
    expect(screen.getByTestId('icon-dialog')).toBeInTheDocument()
    expect(screen.getByText('Column Metadata Debug')).toBeInTheDocument()

    // Check that table renders with data
    expect(screen.getByTestId('basic-ag-table')).toBeInTheDocument()
    expect(screen.getByTestId('row-count')).toHaveTextContent('1')

    // Check that column_name is pinned left
    const colOverrides = screen.getByTestId('col-overrides')
    expect(colOverrides).toHaveTextContent('"column_name":{"pinned":"left"}')

    // Check that cardinality data is included (spread from cardinality object)
    const rowData = screen.getByTestId('row-0')
    expect(rowData).toHaveTextContent('"cardinality":"low"')
    expect(rowData).toHaveTextContent('"source":"from metadata"')
    expect(rowData).toHaveTextContent('"approxCntD":2')
    expect(rowData).toHaveTextContent('"cntD":2')
  })

  it('should handle columns without cardinality data', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <ColumnMetadataDebugger columns={mockColumns} />
      </Provider>
    )

    const rowData = screen.getByTestId('row-0')
    // When no cardinality, the object is null, so these fields won't be present
    expect(rowData).toHaveTextContent('"column_name":"test_col"')
    expect(rowData).toHaveTextContent('"duckdbType":"BOOLEAN"')
  })

  it('should render with empty columns array', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <ColumnMetadataDebugger columns={[]} />
      </Provider>
    )

    expect(screen.getByTestId('row-count')).toHaveTextContent('0')
  })
})