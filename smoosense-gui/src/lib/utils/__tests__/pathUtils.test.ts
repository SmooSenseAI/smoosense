import {
  pathJoin,
  pathBasename,
  pathParent,
  isUrl,
  pathExtension
} from '../pathUtils'

describe('pathUtils (simplified)', () => {
  describe('isUrl', () => {
    test('detects URLs correctly', () => {
      expect(isUrl('s3://bucket/file.txt')).toBe(true)
      expect(isUrl('https://example.com/path')).toBe(true)
      expect(isUrl('http://example.com/path')).toBe(true)
      expect(isUrl('s3-like://storage/data.json')).toBe(true)
      expect(isUrl('/home/user/file.txt')).toBe(false)
      expect(isUrl('C:\\Users\\file.txt')).toBe(false)
      expect(isUrl('file.txt')).toBe(false)
      expect(isUrl('')).toBe(false)
      expect(isUrl('text with https://example.com in middle')).toBe(true)  // contains ://
    })
  })

  describe('pathJoin', () => {
    test('handles empty inputs', () => {
      expect(pathJoin()).toBe('')
      expect(pathJoin('', '', '')).toBe('')
    })

    test('joins absolute paths', () => {
      expect(pathJoin('/home', 'user', 'file.txt')).toBe('/home/user/file.txt')
      expect(pathJoin('/home/user', 'documents', 'file.txt')).toBe('/home/user/documents/file.txt')
      expect(pathJoin('~/Downloads', 'user', 'file.txt')).toBe('~/Downloads/user/file.txt')
      expect(pathJoin('s3://bucket', 'user', 'file.txt')).toBe('s3://bucket/user/file.txt')
    })

    test('joins URLs', () => {
      expect(pathJoin('s3://bucket', 'folder', 'file.txt')).toBe('s3://bucket/folder/file.txt')
      expect(pathJoin('s3://bucket/path', 'to', 'file.txt')).toBe('s3://bucket/path/to/file.txt')
      expect(pathJoin('https://example.com', 'api', 'data')).toBe('https://example.com/api/data')
    })

    test('handles Windows paths', () => {
      expect(pathJoin('C:\\Users', 'Documents', 'file.txt')).toBe('C:\\Users/Documents/file.txt')
    })

    test('handles mixed separators', () => {
      expect(pathJoin('/folder/', 'subfolder\\', 'file.txt')).toBe('/folder/subfolder\\/file.txt')
      expect(pathJoin('s3://bucket/', '/folder/', 'file.txt')).toBe('s3://bucket/folder/file.txt')
    })
  })

  describe('pathBasename', () => {
    test('handles empty inputs', () => {
      expect(pathBasename('')).toBe('')
    })

    test('extracts basename from absolute paths', () => {
      expect(pathBasename('/home/user/file.txt')).toBe('file.txt')
      expect(pathBasename('/file.txt')).toBe('file.txt')
      expect(pathBasename('C:\\Users\\file.txt')).toBe('file.txt')
    })

    test('extracts basename from URLs', () => {
      expect(pathBasename('s3://bucket/folder/file.txt')).toBe('file.txt')
      expect(pathBasename('https://example.com/api/data.json')).toBe('data.json')
    })

    test('handles paths without separators', () => {
      expect(pathBasename('filename.txt')).toBe('filename.txt')
      expect(pathBasename('folder')).toBe('folder')
    })

    test('handles trailing separators', () => {
      expect(pathBasename('/folder/')).toBe('folder')
      expect(pathBasename('/folder')).toBe('folder')
      expect(pathBasename('s3://bucket/folder/')).toBe('folder')
      expect(pathBasename('s3://bucket/folder')).toBe('folder')
    })
    test('handles top level', () => {
      expect(pathBasename('/')).toBe('/')
      expect(pathBasename('~')).toBe('~')
      expect(pathBasename('s3://bucket')).toBe('s3://bucket')
      expect(pathBasename('s3-similar://bucket')).toBe('s3-similar://bucket')
    })
  })

  describe('pathParent', () => {
    test('handles empty inputs', () => {
      expect(pathParent('')).toBe('')
    })

    test('extracts parent from absolute paths', () => {
      expect(pathParent('/home/user/file.txt')).toBe('/home/user')
      expect(pathParent('/file.txt')).toBe('/')
      expect(pathParent('C:\\Users\\file.txt')).toBe('C:/Users')
    })

    test('extracts parent from URLs', () => {
      expect(pathParent('s3://bucket/folder/file.txt')).toBe('s3://bucket/folder')
      expect(pathParent('s3://bucket/file.txt')).toBe('s3://bucket')
      expect(pathParent('https://example.com/api/data.json')).toBe('https://example.com/api')
    })

    test('handles top-level cases', () => {
      expect(pathParent('s3://bucket')).toBe('')
      expect(pathParent('filename.txt')).toBe('')
      expect(pathParent('/')).toBe('')
    })

    test('handles folders', () => {
      expect(pathParent('s3://bucket/folder/')).toBe('s3://bucket')
      expect(pathParent('s3://bucket/folder')).toBe('s3://bucket')
      expect(pathParent('/bucket/folder/')).toBe('/bucket')
      expect(pathParent('/bucket/folder')).toBe('/bucket')
      expect(pathParent('~/folder/')).toBe('~')
      expect(pathParent('~/folder')).toBe('~')
    })

  })

  describe('pathExtension', () => {
    test('extracts file extensions', () => {
      expect(pathExtension('/home/user/file.txt')).toBe('.txt')
      expect(pathExtension('s3://bucket/data.json')).toBe('.json')
      expect(pathExtension('document.pdf')).toBe('.pdf')
      expect(pathExtension('archive.tar.gz')).toBe('.gz')
    })

    test('handles files without extensions', () => {
      expect(pathExtension('/home/user/script')).toBe('')
      expect(pathExtension('s3://bucket/README')).toBe('')
    })

    test('handles dot files', () => {
      expect(pathExtension('.gitignore')).toBe('')
      expect(pathExtension('.bashrc.backup')).toBe('.backup')
    })

    test('handles empty inputs', () => {
      expect(pathExtension('')).toBe('')
      expect(pathExtension('/')).toBe('')
    })
  })

  describe('integration tests', () => {
    test('roundtrip path operations', () => {
      const testPaths = [
        '/home/user/document.pdf',
        's3://bucket/data/file.json',
        'https://example.com/api/data.txt',
        'C:\\Users\\Documents\\file.docx'
      ]

      testPaths.forEach(path => {
        const dir = pathParent(path)
        const base = pathBasename(path)
        const ext = pathExtension(path)
        
        if (base) {
          const reconstructed = pathJoin(dir, base)
          // Note: Windows paths get normalized, so we check the basename and extension are preserved
          expect(pathBasename(reconstructed)).toBe(base)
          expect(pathExtension(reconstructed)).toBe(ext)
        }
      })
    })

    test('complex URL manipulation', () => {
      const basePath = 's3://my-bucket/data/2023'
      const fileName = 'report.json'
      const fullPath = pathJoin(basePath, fileName)
      
      expect(fullPath).toBe('s3://my-bucket/data/2023/report.json')
      expect(pathParent(fullPath)).toBe('s3://my-bucket/data/2023')
      expect(pathBasename(fullPath)).toBe('report.json')
      expect(pathExtension(fullPath)).toBe('.json')
      expect(isUrl(fullPath)).toBe(true)
    })
  })
})