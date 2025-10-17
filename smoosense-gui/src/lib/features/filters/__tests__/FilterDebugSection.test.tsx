import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import FilterDebugSection from '../FilterDebugSection'
import { createTestStore } from '@/lib/test-utils'
import { FilterType } from '../types'
import type { ColumnFilter } from '@/lib/features/colDefs/agSlice'

// Mock CodeMirror
jest.mock('@uiw/react-codemirror', () => {
  return function MockCodeMirror({ value }: { value: string }) {
    return <div data-testid="codemirror">{value}</div>
  }
})

const renderWithProvider = (component: React.ReactElement, stateOverrides?: Parameters<typeof createTestStore>[0]) => {
  const store = createTestStore(stateOverrides)
  return { store, ...render(
    <Provider store={store}>
      {component}
    </Provider>
  )}
}

describe('FilterDebugSection', () => {
  const mockFilter: ColumnFilter = {
    filterType: FilterType.ENUM,
    including: ['true', 'false'],
    null: 'Exclude'
  }

  it('should render nothing when debug mode is off', () => {
    const { container } = renderWithProvider(
      <FilterDebugSection 
        columnName="test_column" 
        filterData={mockFilter}
      />,
      { ui: { debugMode: false } }
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render SQL condition when debug mode is on', () => {
    const { getByText, queryByText } = renderWithProvider(
      <FilterDebugSection 
        columnName="test_column" 
        filterData={mockFilter}
      />,
      { ui: { debugMode: true } }
    )
    
    expect(getByText('SQL Condition:')).toBeInTheDocument()
    expect(queryByText('Filter Data:')).not.toBeInTheDocument()
    expect(getByText('test_column IN (\'true\',\'false\')')).toBeInTheDocument()
  })

  it('should show error message for invalid filter data', () => {
    const invalidFilter = {
      ...mockFilter,
      null: null as unknown as 'Exclude' // This will cause parseFilterItem to throw
    }
    
    const { getByText } = renderWithProvider(
      <FilterDebugSection 
        columnName="test_column" 
        filterData={invalidFilter}
      />,
      { ui: { debugMode: true } }
    )
    
    expect(getByText(/Error:/)).toBeInTheDocument()
  })
})