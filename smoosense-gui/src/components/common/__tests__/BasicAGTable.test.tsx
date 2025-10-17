import { render } from '@testing-library/react'
import BasicAGTable from '../BasicAGTable'
import { createTestStore } from '@/lib/test-utils'
import { Provider } from 'react-redux'

// Mock AG Grid to avoid canvas issues in tests
jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ columnDefs }: { columnDefs: { field?: string; pinned?: string; headerName?: string }[] }) => (
    <div data-testid="ag-grid-mock">
      {columnDefs.map((col, i) => (
        <div key={i} data-testid={`column-${col.field}`} data-pinned={col.pinned}>
          {col.field}: {col.headerName}
        </div>
      ))}
    </div>
  )
}))

describe('BasicAGTable', () => {
  const store = createTestStore()
  
  const sampleData = [
    { name: 'John', age: 30, active: true },
    { name: 'Jane', age: 25, active: false }
  ]

  it('should render without colDefOverrides', () => {
    render(
      <Provider store={store}>
        <BasicAGTable data={sampleData} />
      </Provider>
    )
    
    // Should render the mocked AG Grid
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).toBeInTheDocument()
  })

  it('should apply colDefOverrides correctly', () => {
    const colDefOverrides = {
      name: { pinned: 'left' as const }
    }
    
    render(
      <Provider store={store}>
        <BasicAGTable data={sampleData} colDefOverrides={colDefOverrides} />
      </Provider>
    )
    
    // Check that the name column is pinned left
    const nameColumn = document.querySelector('[data-testid="column-name"]')
    expect(nameColumn).toHaveAttribute('data-pinned', 'left')
  })

  it('should work with empty data', () => {
    render(
      <Provider store={store}>
        <BasicAGTable data={[]} />
      </Provider>
    )
    
    expect(document.querySelector('[data-testid="ag-grid-mock"]')).toBeInTheDocument()
  })
})