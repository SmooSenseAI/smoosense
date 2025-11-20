import { getScheme, isOnCloud } from '../urlUtils'
import { getFileUrl } from '../apiUtils'

describe('urlUtils', () => {
  describe('getScheme', () => {
    it('should return empty string for empty URL', () => {
      expect(getScheme('')).toBe('')
    })

    it('should return empty string for null/undefined URL', () => {
      expect(getScheme('')).toBe('')
    })

    it('should return scheme for HTTP URL', () => {
      expect(getScheme('http://example.com')).toBe('http')
    })

    it('should return scheme for HTTPS URL', () => {
      expect(getScheme('https://example.com')).toBe('https')
    })

    it('should return scheme for S3 URL', () => {
      expect(getScheme('s3://bucket/file.txt')).toBe('s3')
    })

    it('should return scheme for FTP URL', () => {
      expect(getScheme('ftp://server/file.txt')).toBe('ftp')
    })

    it('should return scheme for file URL', () => {
      expect(getScheme('file:///local/path')).toBe('file')
    })

    it('should return lowercase scheme', () => {
      expect(getScheme('HTTP://EXAMPLE.COM')).toBe('http')
      expect(getScheme('S3://BUCKET/FILE')).toBe('s3')
    })

    it('should return empty string for URL without scheme', () => {
      expect(getScheme('example.com')).toBe('')
      expect(getScheme('/local/path')).toBe('')
    })
  })

  describe('getFileUrl', () => {
    it('should create file API URL with encoded path and default redirect=false', () => {
      const path = '/local/file.txt'
      const expected = './api/get-file?path=%2Flocal%2Ffile.txt&redirect=false'
      expect(getFileUrl(path)).toBe(expected)
    })

    it('should properly encode paths with spaces', () => {
      const path = '/local/path with spaces/file.txt'
      // URLSearchParams encodes spaces as +
      const expected = './api/get-file?path=%2Flocal%2Fpath+with+spaces%2Ffile.txt&redirect=false'
      expect(getFileUrl(path)).toBe(expected)
    })

    it('should handle special characters in path', () => {
      const path = '/local/path/file@#$%.txt'
      const expected = './api/get-file?path=%2Flocal%2Fpath%2Ffile%40%23%24%25.txt&redirect=false'
      expect(getFileUrl(path)).toBe(expected)
    })

    it('should add redirect=true when specified', () => {
      const path = '/local/file.pdf'
      const expected = './api/get-file?path=%2Flocal%2Ffile.pdf&redirect=true'
      expect(getFileUrl(path, true)).toBe(expected)
    })
  })

  describe('isOnCloud', () => {
    it('should return empty string for HTTP URLs', () => {
      expect(isOnCloud('http://example.com')).toBe('http')
    })

    it('should return empty string for local paths', () => {
      expect(isOnCloud('/local/path')).toBe('')
    })

    it('should return scheme for S3 URLs', () => {
      expect(isOnCloud('s3://bucket/file.txt')).toBe('s3')
    })

    it('should return scheme for FTP URLs', () => {
      expect(isOnCloud('ftp://server/file.txt')).toBe('ftp')
    })

    it('should return scheme for any cloud storage URL', () => {
      expect(isOnCloud('gs://bucket/file.txt')).toBe('gs')
      expect(isOnCloud('azure://container/file.txt')).toBe('azure')
    })
  })
})