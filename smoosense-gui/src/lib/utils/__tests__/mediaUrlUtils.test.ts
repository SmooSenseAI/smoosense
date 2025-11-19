import { needToResolveMediaUrl, resolveAssetUrl } from '../mediaUrlUtils'

describe('needToResolveMediaUrl', () => {
  describe('non-string values', () => {
    it('should return false for numbers', () => {
      expect(needToResolveMediaUrl(123)).toBe(false)
      expect(needToResolveMediaUrl(0)).toBe(false)
      expect(needToResolveMediaUrl(-1)).toBe(false)
    })

    it('should return false for null and undefined', () => {
      expect(needToResolveMediaUrl(null)).toBe(false)
      expect(needToResolveMediaUrl(undefined)).toBe(false)
    })

    it('should return false for objects', () => {
      expect(needToResolveMediaUrl({})).toBe(false)
      expect(needToResolveMediaUrl({ url: './image.jpg' })).toBe(false)
    })

    it('should return false for arrays', () => {
      expect(needToResolveMediaUrl([])).toBe(false)
      expect(needToResolveMediaUrl(['./image.jpg'])).toBe(false)
    })

    it('should return false for booleans', () => {
      expect(needToResolveMediaUrl(true)).toBe(false)
      expect(needToResolveMediaUrl(false)).toBe(false)
    })
  })

  describe('strings without path prefixes', () => {
    it('should return false for HTTP URLs', () => {
      expect(needToResolveMediaUrl('http://example.com/image.jpg')).toBe(false)
      expect(needToResolveMediaUrl('https://example.com/video.mp4')).toBe(false)
    })

    it('should return false for plain filenames without path prefix', () => {
      expect(needToResolveMediaUrl('image.jpg')).toBe(false)
      expect(needToResolveMediaUrl('video.mp4')).toBe(false)
    })

    it('should return false for empty strings', () => {
      expect(needToResolveMediaUrl('')).toBe(false)
    })
  })

  describe('S3 URLs', () => {
    it('should return true for S3 URLs with media extensions', () => {
      expect(needToResolveMediaUrl('s3://bucket/audio.mp3')).toBe(true)
      expect(needToResolveMediaUrl('s3://my-bucket/images/photo.jpg')).toBe(true)
      expect(needToResolveMediaUrl('s3://bucket/video.mp4')).toBe(true)
      expect(needToResolveMediaUrl('s3://bucket/music.wav')).toBe(true)
      expect(needToResolveMediaUrl('s3://bucket/document.pdf')).toBe(true)
    })

    it('should return false for S3 URLs without media extensions', () => {
      expect(needToResolveMediaUrl('s3://bucket/file.txt')).toBe(false)
      expect(needToResolveMediaUrl('s3://bucket/data.csv')).toBe(false)
    })
  })

  describe('strings with path prefixes but non-media extensions', () => {
    it('should return false for relative paths with non-media extensions', () => {
      expect(needToResolveMediaUrl('./file.txt')).toBe(false)
      expect(needToResolveMediaUrl('./data.json')).toBe(false)
    })

    it('should return false for absolute paths with non-media extensions', () => {
      expect(needToResolveMediaUrl('/home/user/file.txt')).toBe(false)
      expect(needToResolveMediaUrl('/data/document.csv')).toBe(false)
    })

    it('should return false for home paths with non-media extensions', () => {
      expect(needToResolveMediaUrl('~/Documents/file.txt')).toBe(false)
      expect(needToResolveMediaUrl('~/data.xlsx')).toBe(false)
    })
  })

  describe('valid media URLs with relative paths', () => {
    it('should return true for relative image paths', () => {
      expect(needToResolveMediaUrl('./images/photo.jpg')).toBe(true)
      expect(needToResolveMediaUrl('./image.png')).toBe(true)
      expect(needToResolveMediaUrl('./pic.gif')).toBe(true)
      expect(needToResolveMediaUrl('./logo.svg')).toBe(true)
      expect(needToResolveMediaUrl('./photo.webp')).toBe(true)
    })

    it('should return true for relative video paths', () => {
      expect(needToResolveMediaUrl('./videos/clip.mp4')).toBe(true)
      expect(needToResolveMediaUrl('./video.webm')).toBe(true)
      expect(needToResolveMediaUrl('./movie.mov')).toBe(true)
      expect(needToResolveMediaUrl('./recording.avi')).toBe(true)
    })

    it('should return true for relative audio paths', () => {
      expect(needToResolveMediaUrl('./audio/sound.mp3')).toBe(true)
      expect(needToResolveMediaUrl('./music.wav')).toBe(true)
      expect(needToResolveMediaUrl('./voice.ogg')).toBe(true)
      expect(needToResolveMediaUrl('./song.m4a')).toBe(true)
    })

    it('should return true for relative PDF paths', () => {
      expect(needToResolveMediaUrl('./document.pdf')).toBe(true)
      expect(needToResolveMediaUrl('./docs/report.pdf')).toBe(true)
    })
  })

  describe('valid media URLs with absolute paths', () => {
    it('should return true for absolute image paths', () => {
      expect(needToResolveMediaUrl('/home/user/images/photo.jpg')).toBe(true)
      expect(needToResolveMediaUrl('/data/image.png')).toBe(true)
      expect(needToResolveMediaUrl('/tmp/screenshot.jpeg')).toBe(true)
    })

    it('should return true for absolute video paths', () => {
      expect(needToResolveMediaUrl('/videos/clip.mp4')).toBe(true)
      expect(needToResolveMediaUrl('/home/user/movie.webm')).toBe(true)
    })

    it('should return true for absolute audio paths', () => {
      expect(needToResolveMediaUrl('/audio/sound.mp3')).toBe(true)
      expect(needToResolveMediaUrl('/music/track.wav')).toBe(true)
    })

    it('should return true for absolute PDF paths', () => {
      expect(needToResolveMediaUrl('/documents/report.pdf')).toBe(true)
      expect(needToResolveMediaUrl('/home/user/file.pdf')).toBe(true)
    })
  })

  describe('valid media URLs with home paths', () => {
    it('should return true for home image paths', () => {
      expect(needToResolveMediaUrl('~/Pictures/photo.jpg')).toBe(true)
      expect(needToResolveMediaUrl('~/image.png')).toBe(true)
    })

    it('should return true for home video paths', () => {
      expect(needToResolveMediaUrl('~/Videos/clip.mp4')).toBe(true)
      expect(needToResolveMediaUrl('~/movie.webm')).toBe(true)
    })

    it('should return true for home audio paths', () => {
      expect(needToResolveMediaUrl('~/Music/song.mp3')).toBe(true)
      expect(needToResolveMediaUrl('~/audio.wav')).toBe(true)
    })

    it('should return true for home PDF paths', () => {
      expect(needToResolveMediaUrl('~/Documents/report.pdf')).toBe(true)
      expect(needToResolveMediaUrl('~/file.pdf')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle paths with multiple dots', () => {
      expect(needToResolveMediaUrl('./path/to/../image.jpg')).toBe(true)
    })

    it('should be case-sensitive for extensions', () => {
      expect(needToResolveMediaUrl('./image.JPG')).toBe(true)
      expect(needToResolveMediaUrl('./image.PNG')).toBe(true)
    })

    it('should handle paths with spaces', () => {
      expect(needToResolveMediaUrl('./path with spaces/image.jpg')).toBe(true)
      expect(needToResolveMediaUrl('/home/user/my photos/pic.png')).toBe(true)
    })

    it('should handle paths with special characters', () => {
      expect(needToResolveMediaUrl('./images/photo@2x.jpg')).toBe(true)
      expect(needToResolveMediaUrl('/data/file_#1.png')).toBe(true)
    })
  })
})

describe('resolveAssetUrl', () => {
  const baseUrl = 'http://localhost:8001'
  const localTablePath = '/data/folder/file.parquet'
  const s3TablePath = 's3://my-bucket/data/folder/file.parquet'
  const httpsTablePath = 'https://example.com/data/folder/file.parquet'

  describe('relative URLs starting with ./ - local tablePath', () => {
    it('should resolve relative URL with local tablePath', () => {
      const url = './images/photo.jpg'
      const expected = 'api/get-file?path=%2Fdata%2Ffolder%2Fimages%2Fphoto.jpg&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with nested path', () => {
      const url = './subfolder/nested/file.txt'
      const expected = 'api/get-file?path=%2Fdata%2Ffolder%2Fsubfolder%2Fnested%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with parent directory', () => {
      const url = './../other/file.txt'
      const expected = 'api/get-file?path=%2Fdata%2Ffolder%2F..%2Fother%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('relative URLs starting with ./ - S3 tablePath', () => {
    it('should resolve relative URL with S3 tablePath', () => {
      const url = './images/photo.jpg'
      const expectedUrl = 's3://my-bucket/data/folder/images/photo.jpg'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(expectedUrl)
      expect(resolveAssetUrl(url, s3TablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with nested path (S3)', () => {
      const url = './subfolder/nested/file.txt'
      const expectedUrl = 's3://my-bucket/data/folder/subfolder/nested/file.txt'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(expectedUrl)
      expect(resolveAssetUrl(url, s3TablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should resolve relative URL with parent directory (S3)', () => {
      const url = './../other/file.txt'
      const expectedUrl = 's3://my-bucket/data/other/file.txt'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(expectedUrl)
      expect(resolveAssetUrl(url, s3TablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('relative URLs starting with ./ - HTTPS tablePath', () => {
    it('should resolve relative URL with HTTPS tablePath', () => {
      const url = './images/photo.jpg'
      const expectedUrl = 'https://example.com/data/folder/images/photo.jpg'
      expect(resolveAssetUrl(url, httpsTablePath, baseUrl)).toBe(expectedUrl)
    })

    it('should resolve relative URL with nested path (HTTPS)', () => {
      const url = './subfolder/nested/file.txt'
      const expectedUrl = 'https://example.com/data/folder/subfolder/nested/file.txt'
      expect(resolveAssetUrl(url, httpsTablePath, baseUrl)).toBe(expectedUrl)
    })

    it('should resolve relative URL with parent directory (HTTPS)', () => {
      const url = './../other/file.txt'
      const expectedUrl = 'https://example.com/data/other/file.txt'
      expect(resolveAssetUrl(url, httpsTablePath, baseUrl)).toBe(expectedUrl)
    })

    it('should resolve relative URL with HTTP tablePath', () => {
      const httpTablePath = 'http://example.com/data/folder/file.parquet'
      const url = './images/photo.jpg'
      const expectedUrl = 'http://example.com/data/folder/images/photo.jpg'
      expect(resolveAssetUrl(url, httpTablePath, baseUrl)).toBe(expectedUrl)
    })
  })

  describe('absolute file paths starting with /', () => {
    it('should convert absolute path to API URL with baseUrl', () => {
      const url = '/data/images/photo.jpg'
      const expected = 'api/get-file?path=%2Fdata%2Fimages%2Fphoto.jpg&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle paths with spaces', () => {
      const url = '/data/path with spaces/file.txt'
      const expected = 'api/get-file?path=%2Fdata%2Fpath+with+spaces%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle paths with special characters', () => {
      const url = '/data/file@#$%.txt'
      const expected = 'api/get-file?path=%2Fdata%2Ffile%40%23%24%25.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('home directory paths starting with ~/', () => {
    it('should convert home path to API URL with baseUrl', () => {
      const url = '~/Documents/file.txt'
      const expected = 'api/get-file?path=%7E%2FDocuments%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle home path with nested folders', () => {
      const url = '~/folder/subfolder/file.txt'
      const expected = 'api/get-file?path=%7E%2Ffolder%2Fsubfolder%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('S3 URLs', () => {
    it('should proxy S3 URL through s3-proxy endpoint', () => {
      const url = 's3://bucket/folder/file.txt'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(url)
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should proxy S3 URL with special characters', () => {
      const url = 's3://my-bucket/path with spaces/file@#.jpg'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(url)
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should proxy S3 URL with nested paths', () => {
      const url = 's3://bucket/folder/subfolder/image.png'
      const expected = 'api/s3-proxy?url=' + encodeURIComponent(url)
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })
  })

  describe('absolute URLs', () => {
    it('should return HTTP URL unchanged', () => {
      const url = 'http://example.com/image.jpg'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(url)
    })

    it('should return HTTPS URL unchanged', () => {
      const url = 'https://example.com/image.jpg'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(url)
    })

    it('should return other protocol URLs unchanged', () => {
      const url = 'ftp://server/file.txt'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(url)
    })

    it('should return data URLs unchanged', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(url)
    })
  })

  describe('edge cases', () => {
    it('should handle root path /', () => {
      const url = '/'
      const expected = 'api/get-file?path=%2F&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle single file in root', () => {
      const url = '/file.txt'
      const expected = 'api/get-file?path=%2Ffile.txt&redirect=false'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(baseUrl + '/' + expected)
    })

    it('should handle URL with query parameters (absolute URL)', () => {
      const url = 'https://example.com/image.jpg?size=large'
      expect(resolveAssetUrl(url, localTablePath, baseUrl)).toBe(url)
    })
  })
})
