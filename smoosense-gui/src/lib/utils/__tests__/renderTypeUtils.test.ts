import { RenderType } from '../agGridCellRenderers'
import { isDateString, inferRenderTypeFromData } from '../renderTypeUtils'

describe('isDateString', () => {
  describe('Valid date formats', () => {
    it('should return true for YYYY-MM-DD format', () => {
      expect(isDateString('2023-01-01')).toBe(true)
      expect(isDateString('2023-12-31')).toBe(true)
      expect(isDateString('2000-06-15')).toBe(true)
    })

    it('should return true for ISO date format', () => {
      expect(isDateString('2023-01-01T10:30:00')).toBe(true)
      expect(isDateString('2023-12-31T23:59:59Z')).toBe(true)
      expect(isDateString('2023-06-15T00:00:00.000Z')).toBe(true)
    })

    it('should return true for MM/DD/YYYY format', () => {
      expect(isDateString('01/01/2023')).toBe(true)
      expect(isDateString('12/31/2023')).toBe(true)
      expect(isDateString('6/15/2000')).toBe(true)
    })

    it('should return true for MM-DD-YYYY format', () => {
      expect(isDateString('01-01-2023')).toBe(true)
      expect(isDateString('12-31-2023')).toBe(true)
      expect(isDateString('6-15-2000')).toBe(true)
    })
  })

  describe('Invalid date formats', () => {
    it('should return false for regular text', () => {
      expect(isDateString('hello world')).toBe(false)
      expect(isDateString('not a date')).toBe(false)
    })

    it('should return false for numbers', () => {
      expect(isDateString('123456')).toBe(false)
      expect(isDateString('42')).toBe(false)
    })

    it('should return false for invalid date values', () => {
      expect(isDateString('2023-13-01')).toBe(false) // Invalid month
      expect(isDateString('2023-00-01')).toBe(false) // Invalid month
    })

    it('should return false for partial date formats', () => {
      expect(isDateString('2023')).toBe(false)
      expect(isDateString('2023-01')).toBe(false)
    })

    it('should return false for URLs', () => {
      expect(isDateString('https://example.com')).toBe(false)
      expect(isDateString('http://test.com/image.jpg')).toBe(false)
    })
  })
})

describe('inferRenderTypeFromData', () => {
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

    it('should return VideoUrl for video URLs', () => {
      const videoUrls = [
        'https://example.com/video1.mp4',
        'https://example.com/video2.webm'
      ]
      expect(inferRenderTypeFromData(videoUrls)).toBe(RenderType.VideoUrl)
    })

    it('should return AudioUrl for audio URLs', () => {
      const audioUrls = [
        'https://example.com/audio1.mp3',
        'https://example.com/audio2.wav'
      ]
      expect(inferRenderTypeFromData(audioUrls)).toBe(RenderType.AudioUrl)
    })

    it('should return PdfUrl for PDF URLs', () => {
      const pdfUrls = [
        'https://example.com/doc1.pdf',
        'https://example.com/doc2.pdf'
      ]
      expect(inferRenderTypeFromData(pdfUrls)).toBe(RenderType.PdfUrl)
    })

    it('should return IFrame for iframe URLs', () => {
      const iframeUrls = [
        'iframe+https://example.com/embed',
        'iframe+http://test.com/widget'
      ]
      expect(inferRenderTypeFromData(iframeUrls)).toBe(RenderType.IFrame)
    })

    it('should return ImageMask when column name contains image_mask', () => {
      const imageUrls = ['https://example.com/mask1.png', 'https://example.com/mask2.png']
      expect(inferRenderTypeFromData(imageUrls, 'my_image_mask')).toBe(RenderType.ImageMask)
    })

    it('should return WordScores when column name contains word_score', () => {
      const textValues = ['some text', 'other text']
      expect(inferRenderTypeFromData(textValues, 'my_word_score')).toBe(RenderType.WordScores)
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

    it('should return Bbox for bbox arrays when column name contains bbox', () => {
      const bboxValues = [[10, 20, 100, 200], [50, 60, 150, 250]]
      expect(inferRenderTypeFromData(bboxValues, 'detection_bbox')).toBe(RenderType.Bbox)
    })

    it('should return ImageList for arrays of image URLs', () => {
      const imageLists = [
        ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        ['https://example.com/img3.png']
      ]
      expect(inferRenderTypeFromData(imageLists)).toBe(RenderType.ImageList)
    })

    it('should return VideoList for arrays of video URLs', () => {
      const videoLists = [
        ['https://example.com/vid1.mp4', 'https://example.com/vid2.mp4'],
        ['https://example.com/vid3.webm']
      ]
      expect(inferRenderTypeFromData(videoLists)).toBe(RenderType.VideoList)
    })

    it('should return AudioList for arrays of audio URLs', () => {
      const audioLists = [
        ['https://example.com/audio1.mp3', 'https://example.com/audio2.wav'],
        ['https://example.com/audio3.mp3']
      ]
      expect(inferRenderTypeFromData(audioLists)).toBe(RenderType.AudioList)
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
