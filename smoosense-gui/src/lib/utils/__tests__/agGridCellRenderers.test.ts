import { RenderType, createCellRenderer, createCellRendererSelector, inferColumnDefinitions, inferRenderTypeFromData } from '../agGridCellRenderers'
import type { ICellRendererParams } from 'ag-grid-community'


// New tests for column-wide type inference
describe('inferColumnDefinitions (column-wide analysis)', () => {
  describe('Consistent boolean columns', () => {
    it('should infer Boolean when all non-null values are booleans', () => {
      const data = [
        { boolCol: true, mixedCol: true },
        { boolCol: false, mixedCol: 'text' },
        { boolCol: null, mixedCol: false },
        { boolCol: true, mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const boolColumn = columns.find(col => col.field === 'boolCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(boolColumn?.cellRenderer.displayName).toBe('CellRendererSelector_boolean')
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('Consistent number columns', () => {
    it('should infer Number when all non-null values are numbers', () => {
      const data = [
        { numCol: 42, mixedCol: 42 },
        { numCol: 3.14, mixedCol: 'text' },
        { numCol: null, mixedCol: 0 },
        { numCol: -123, mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const numColumn = columns.find(col => col.field === 'numCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(numColumn?.cellRenderer.displayName).toBe('CellRendererSelector_number')
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('Consistent image URL columns', () => {
    it('should infer ImageUrl when all non-null values are image URLs', () => {
      const data = [
        { imageCol: 'https://example.com/image1.jpg', mixedCol: 'https://example.com/image1.jpg' },
        { imageCol: 'https://example.com/image2.png', mixedCol: 'not-a-url' },
        { imageCol: null, mixedCol: 'https://example.com/image3.gif' },
        { imageCol: 'https://example.com/image4.webp', mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const imageColumn = columns.find(col => col.field === 'imageCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(imageColumn?.cellRenderer.displayName).toBe('CellRendererSelector_imageUrl')
      expect(imageColumn?.width).toBe(100) // Should use fixed width for images
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
      expect(mixedColumn?.width).toBe(150) // Should use default width
    })

    it('should infer ImageUrl for S3 and other scheme image URLs', () => {
      const data = [
        { s3Images: 's3://bucket/image1.jpg' },
        { s3Images: 'ftp://server/image2.png' },
        { s3Images: 'file://local/image3.gif' },
        { s3Images: null }
      ]
      const columns = inferColumnDefinitions(data)
      const s3Column = columns.find(col => col.field === 's3Images')
      
      expect(s3Column?.cellRenderer.displayName).toBe('CellRendererSelector_imageUrl')
    })
  })

  describe('Consistent video URL columns', () => {
    it('should infer VideoUrl when all non-null values are video URLs', () => {
      const data = [
        { videoCol: 'https://example.com/video1.mp4', mixedCol: 'https://example.com/video1.mp4' },
        { videoCol: 'https://youtube.com/watch?v=123', mixedCol: 'regular text' },
        { videoCol: null, mixedCol: 'https://vimeo.com/456' },
        { videoCol: 'https://youtu.be/abc', mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const videoColumn = columns.find(col => col.field === 'videoCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(videoColumn?.cellRenderer.displayName).toBe('CellRendererSelector_videoUrl')
      expect(videoColumn?.width).toBe(100) // Should use fixed width for videos
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('Consistent object columns', () => {
    it('should infer Json when all non-null values are objects', () => {
      const data = [
        { jsonCol: { key: 'value1' }, mixedCol: { key: 'value1' } },
        { jsonCol: [1, 2, 3], mixedCol: 'text' },
        { jsonCol: null, mixedCol: { nested: { prop: 'val' } } },
        { jsonCol: { another: 'object' }, mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const jsonColumn = columns.find(col => col.field === 'jsonCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(jsonColumn?.cellRenderer.displayName).toBe('CellRendererSelector_json')
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('All null columns', () => {
    it('should infer Null when all values are null or undefined', () => {
      const data = [
        { nullCol: null, undefinedCol: undefined },
        { nullCol: null, undefinedCol: null },
        { nullCol: undefined, undefinedCol: undefined }
      ]
      const columns = inferColumnDefinitions(data)
      const nullColumn = columns.find(col => col.field === 'nullCol')
      const undefinedColumn = columns.find(col => col.field === 'undefinedCol')
      
      expect(nullColumn?.cellRenderer.displayName).toBe('CellRendererSelector_null')
      expect(undefinedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_null')
    })
  })

  describe('Mixed type columns default to Text', () => {
    it('should infer Text when values have mixed types', () => {
      const data = [
        { mixedCol: 'text' },
        { mixedCol: 123 },
        { mixedCol: true },
        { mixedCol: { key: 'value' } },
        { mixedCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('String-based number columns', () => {
    it('should infer Number when all non-null string values are numeric', () => {
      const data = [
        { numStringCol: '123', mixedStringCol: '123' },
        { numStringCol: '45.67', mixedStringCol: 'not-a-number' },
        { numStringCol: null, mixedStringCol: '89.0' },
        { numStringCol: '  -42  ', mixedStringCol: null }
      ]
      const columns = inferColumnDefinitions(data)
      const numStringColumn = columns.find(col => col.field === 'numStringCol')
      const mixedStringColumn = columns.find(col => col.field === 'mixedStringCol')
      
      expect(numStringColumn?.cellRenderer.displayName).toBe('CellRendererSelector_number')
      expect(mixedStringColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('Date columns', () => {
    it('should infer Date when all non-null values are Date objects', () => {
      const data = [
        { dateCol: new Date('2023-01-01'), mixedCol: new Date('2023-01-01') },
        { dateCol: new Date('2023-12-31'), mixedCol: 'not-a-date' },
        { dateCol: null, mixedCol: new Date('2023-06-15') }
      ]
      const columns = inferColumnDefinitions(data)
      const dateColumn = columns.find(col => col.field === 'dateCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(dateColumn?.cellRenderer.displayName).toBe('CellRendererSelector_date')
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })

    it('should infer Date when all non-null string values are date strings', () => {
      const data = [
        { dateStringCol: '2023-01-01', mixedCol: '2023-01-01' },
        { dateStringCol: '2023-12-31T10:30:00Z', mixedCol: 'regular text' },
        { dateStringCol: null, mixedCol: '2023-06-15' }
      ]
      const columns = inferColumnDefinitions(data)
      const dateStringColumn = columns.find(col => col.field === 'dateStringCol')
      const mixedColumn = columns.find(col => col.field === 'mixedCol')
      
      expect(dateStringColumn?.cellRenderer.displayName).toBe('CellRendererSelector_date')
      expect(mixedColumn?.cellRenderer.displayName).toBe('CellRendererSelector_text')
    })
  })
})

describe('createCellRenderer', () => {
  describe('ImageUrl renderer', () => {
    it('should create a renderer for ImageUrl type', () => {
      const renderer = createCellRenderer(RenderType.ImageUrl)
      expect(renderer).toBeDefined()
      expect(renderer.displayName).toBe('CellRenderer_imageUrl')
    })
  })

  describe('Text renderer', () => {
    it('should create a renderer for Text type', () => {
      const renderer = createCellRenderer(RenderType.Text)
      expect(renderer).toBeDefined()
      expect(renderer.displayName).toBe('CellRenderer_text')
    })
  })
})

describe('createCellRendererSelector', () => {
  describe('ImageUrl renderer selector', () => {
    it('should create a selector for ImageUrl type', () => {
      const selector = createCellRendererSelector(RenderType.ImageUrl)
      expect(selector).toBeDefined()
      expect(selector.displayName).toBe('CellRendererSelector_imageUrl')
    })
  })

  describe('Text renderer selector', () => {
    it('should create a selector for Text type', () => {
      const selector = createCellRendererSelector(RenderType.Text)
      expect(selector).toBeDefined()
      expect(selector.displayName).toBe('CellRendererSelector_text')
    })
  })

  describe('Overflow detection', () => {
    it('should handle text content without errors', () => {
      const renderer = createCellRenderer(RenderType.Text)
      expect(() => {
        const params = {
          value: 'Long text content that might overflow in narrow columns',
          node: {},
          data: {},
          colDef: {},
          column: {},
          api: {},
          columnApi: {},
          context: {},
          rowIndex: 0,
          getValue: () => 'test'
        }
        renderer(params as unknown as ICellRendererParams)
      }).not.toThrow()
    })
  })
})


// New tests for the refactored inferRenderTypeFromData function
describe('inferRenderTypeFromData (values array)', () => {
  describe('Boolean values', () => {
    it('should return Boolean for array of booleans', () => {
      expect(inferRenderTypeFromData([true, false, true])).toBe(RenderType.Boolean)
    })

    it('should return Boolean for mixed booleans and nulls', () => {
      expect(inferRenderTypeFromData([true, null, false, undefined])).toBe(RenderType.Boolean)
    })
  })

  describe('Number values', () => {
    it('should return Number for array of numbers', () => {
      expect(inferRenderTypeFromData([42, 3.14, -123])).toBe(RenderType.Number)
    })

    it('should return Number for mixed numbers and nulls', () => {
      expect(inferRenderTypeFromData([42, null, 3.14, undefined])).toBe(RenderType.Number)
    })
  })

  describe('String values', () => {
    it('should return ImageUrl for array of image URLs', () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.png',
        'https://example.com/image3.gif'
      ]
      expect(inferRenderTypeFromData(imageUrls)).toBe(RenderType.ImageUrl)
    })

    it('should return ImageUrl for array of S3 image URLs', () => {
      const s3ImageUrls = [
        's3://bucket/image1.jpg',
        'ftp://server/image2.png',
        'file://local/image3.gif'
      ]
      expect(inferRenderTypeFromData(s3ImageUrls)).toBe(RenderType.ImageUrl)
    })

    it('should return ImageUrl for specific S3 sense-table-demo URL', () => {
      const specificS3Url = ['s3://sense-table-demo/tmp/r0001_05.png']
      expect(inferRenderTypeFromData(specificS3Url)).toBe(RenderType.ImageUrl)
    })

    it('should return HyperLink for array of S3 URLs that are not images', () => {
      const s3Urls = [
        's3://bucket/file1.txt',
        'ftp://server/document.pdf',
        'file://local/data.json'
      ]
      expect(inferRenderTypeFromData(s3Urls)).toBe(RenderType.HyperLink)
    })

    it('should return Text for mixed string types', () => {
      const mixedStrings = [
        'https://example.com/image1.jpg',
        'regular text',
        'https://example.com/image2.png'
      ]
      expect(inferRenderTypeFromData(mixedStrings)).toBe(RenderType.Text)
    })

    it('should return Date for array of date strings', () => {
      const dateStrings = ['2023-01-01', '2023-12-31', '2023-06-15']
      expect(inferRenderTypeFromData(dateStrings)).toBe(RenderType.Date)
    })

    it('should return Number for array of number strings', () => {
      const numberStrings = ['123', '45.67', '-42']
      expect(inferRenderTypeFromData(numberStrings)).toBe(RenderType.Number)
    })
  })

  describe('Object values', () => {
    it('should return Json for array of objects', () => {
      const objects = [{ key: 'value1' }, [1, 2, 3], { another: 'object' }]
      expect(inferRenderTypeFromData(objects)).toBe(RenderType.Json)
    })

    it('should return Date for array of Date objects', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-12-31'), new Date('2023-06-15')]
      expect(inferRenderTypeFromData(dates)).toBe(RenderType.Date)
    })
  })

  describe('Null and undefined values', () => {
    it('should return Null for array of only nulls', () => {
      expect(inferRenderTypeFromData([null, null, null])).toBe(RenderType.Null)
    })

    it('should return Null for array of only undefined', () => {
      expect(inferRenderTypeFromData([undefined, undefined, undefined])).toBe(RenderType.Null)
    })

    it('should return Null for empty array', () => {
      expect(inferRenderTypeFromData([])).toBe(RenderType.Null)
    })
  })

  describe('Mixed type values', () => {
    it('should return Text for array with mixed types', () => {
      const mixedValues = ['text', 123, true, { key: 'value' }, null]
      expect(inferRenderTypeFromData(mixedValues)).toBe(RenderType.Text)
    })
  })
})