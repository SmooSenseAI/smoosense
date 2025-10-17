import { evaluateAllExpressionsForAllRows, evaluateDictExpressions } from '../derivedColumnUtils'
import { RenderType } from '../agGridCellRenderers'
import type { DerivedColumn } from '@/lib/features/derivedColumns/derivedColumnsSlice'

describe('derivedColumnUtils', () => {
  describe('evaluateAllExpressionsForAllRows', () => {
    it('should evaluate JSONata expressions with & operator', async () => {
      const derivedColumns: DerivedColumn[] = [
        {
          name: 'full_name',
          expression: 'first_name & " " & last_name',
          renderType: RenderType.Text
        }
      ]

      const rowData = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns,
        rowData
      })

      expect(result).toEqual([
        { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' },
        { first_name: 'Jane', last_name: 'Smith', full_name: 'Jane Smith' }
      ])
    })

    it('should evaluate simple JSONata field references', async () => {
      const derivedColumns: DerivedColumn[] = [
        {
          name: 'upper_name',
          expression: '$uppercase(first_name)',
          renderType: RenderType.Text
        }
      ]

      const rowData = [
        { first_name: 'john' },
        { first_name: 'jane' }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns,
        rowData
      })

      expect(result).toEqual([
        { first_name: 'john', upper_name: 'JOHN' },
        { first_name: 'jane', upper_name: 'JANE' }
      ])
    })

    it('should handle expressions with numbers and calculations', async () => {
      const derivedColumns: DerivedColumn[] = [
        {
          name: 'total_price',
          expression: 'price * quantity',
          renderType: RenderType.Number
        }
      ]

      const rowData = [
        { price: 10.5, quantity: 2 },
        { price: 15.25, quantity: 3 }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns,
        rowData
      })

      expect(result).toEqual([
        { price: 10.5, quantity: 2, total_price: '21' },
        { price: 15.25, quantity: 3, total_price: '45.75' }
      ])
    })

    it('should handle errors gracefully', async () => {
      const derivedColumns: DerivedColumn[] = [
        {
          name: 'invalid',
          expression: 'invalid(syntax',
          renderType: RenderType.Text
        }
      ]

      const rowData = [
        { name: 'test' }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns,
        rowData
      })

      expect(result).toEqual([
        { name: 'test', invalid: '' }
      ])
    })

    it('should handle parameter-based URL construction', async () => {
      const derivedColumns: DerivedColumn[] = [
        {
          name: 'iframe_url',
          baseUrl: 'https://example.com/viewer',
          params: {
            'image': 'image_url',
            'label': 'category_name'
          },
          renderType: RenderType.IFrame
        }
      ]

      const rowData = [
        { image_url: 'test1.jpg', category_name: 'cat1' }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns,
        rowData
      })

      expect(result[0].iframe_url).toContain('https://example.com/viewer')
      expect(result[0].iframe_url).toContain('image=test1.jpg')
      expect(result[0].iframe_url).toContain('label=cat1')
    })

    it('should return original data when no derived columns', async () => {
      const rowData = [
        { name: 'test' }
      ]

      const result = await evaluateAllExpressionsForAllRows({
        derivedColumns: [],
        rowData
      })

      expect(result).toEqual(rowData)
    })
  })

  describe('evaluateDictExpressions', () => {
    it('should evaluate dictionary of JSONata expressions', async () => {
      const params = {
        'full_name': 'first_name & " " & last_name',
        'upper_first': '$uppercase(first_name)'
      }

      const singleRowData = {
        first_name: 'John',
        last_name: 'Doe'
      }

      const result = await evaluateDictExpressions({ params, singleRowData })

      expect(result).toEqual({
        'full_name': 'John Doe',
        'upper_first': 'JOHN'
      })
    })
  })
})