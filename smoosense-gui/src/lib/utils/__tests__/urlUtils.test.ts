import { getScheme, needProxy, proxyedUrl, isOnCloud } from '../urlUtils'
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

  describe('needProxy', () => {
    it('should return false for HTTP URLs', () => {
      expect(needProxy('http://example.com')).toBe(false)
    })

    it('should return false for HTTPS URLs', () => {
      expect(needProxy('https://example.com')).toBe(false)
    })

    it('should return false for URLs without scheme', () => {
      expect(needProxy('example.com')).toBe(false)
      expect(needProxy('/local/path')).toBe(false)
    })

    it('should return true for S3 URLs', () => {
      expect(needProxy('s3://bucket/file.txt')).toBe(true)
    })

    it('should return true for FTP URLs', () => {
      expect(needProxy('ftp://server/file.txt')).toBe(true)
    })

    it('should return true for file URLs', () => {
      expect(needProxy('file:///local/path')).toBe(true)
    })

    it('should return true for custom scheme URLs', () => {
      expect(needProxy('custom://protocol/resource')).toBe(true)
    })
  })

  describe('proxyedUrl', () => {
    it('should return original URL for HTTP URLs', () => {
      const url = 'http://example.com/file.txt'
      expect(proxyedUrl(url)).toBe(url)
    })

    it('should return original URL for HTTPS URLs', () => {
      const url = 'https://example.com/file.txt'
      expect(proxyedUrl(url)).toBe(url)
    })

    it('should return proxied URL for S3 URLs', () => {
      const url = 's3://bucket/file.txt'
      const expected = `./api/s3-proxy?url=${encodeURIComponent(url)}`
      expect(proxyedUrl(url)).toBe(expected)
    })

    it('should return proxied URL for FTP URLs', () => {
      const url = 'ftp://server/file.txt'
      const expected = `./api/s3-proxy?url=${encodeURIComponent(url)}`
      expect(proxyedUrl(url)).toBe(expected)
    })

    it('should properly encode URL parameters', () => {
      const url = 's3://bucket/path with spaces/file.txt'
      const expected = `./api/s3-proxy?url=${encodeURIComponent(url)}`
      expect(proxyedUrl(url)).toBe(expected)
    })

    it('should return relative URLs unchanged when starting with ./', () => {
      const url = './images/small.jpg'
      expect(proxyedUrl(url)).toBe(url)
    })

    it('should return URLs unchanged when starting with /', () => {
      const url = '/local/file.txt'
      expect(proxyedUrl(url)).toBe(url)
    })

    it('should return URLs unchanged when starting with ~/', () => {
      const url = '~/home/file.txt'
      expect(proxyedUrl(url)).toBe(url)
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