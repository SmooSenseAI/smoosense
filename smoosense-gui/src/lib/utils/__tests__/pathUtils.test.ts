import {
  pathJoin,
  pathBasename,
  pathParent,
  isUrl,
  pathExtension,
  pathRelative
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

  describe('pathRelative', () => {
    test('handles empty or invalid inputs', () => {
      expect(pathRelative('', '')).toBe('')
      expect(pathRelative('', 's3://bucket/data')).toBe('')
      expect(pathRelative('s3://bucket/data', '')).toBe('')
      // @ts-expect-error - testing invalid input handling
      expect(pathRelative(null, 's3://bucket')).toBe('')
      // @ts-expect-error - testing invalid input handling
      expect(pathRelative('s3://bucket', null)).toBe('')
    })

    test('returns empty string for same paths', () => {
      expect(pathRelative('s3://bucket/data', 's3://bucket/data')).toBe('')
      expect(pathRelative('s3://bucket/data/', 's3://bucket/data')).toBe('')
      expect(pathRelative('s3://bucket/data', 's3://bucket/data/')).toBe('')
      expect(pathRelative('/home/user', '/home/user')).toBe('')
    })

    test('extracts relative paths from URLs', () => {
      expect(pathRelative('s3://bucket/data/folder/file.txt', 's3://bucket/data')).toBe('folder/file.txt')
      expect(pathRelative('s3://bucket/data/folder/subfolder/file.txt', 's3://bucket/data')).toBe('folder/subfolder/file.txt')
      expect(pathRelative('s3://bucket/data/file.txt', 's3://bucket/data')).toBe('file.txt')
      expect(pathRelative('https://example.com/api/v1/data', 'https://example.com/api')).toBe('v1/data')
    })

    test('extracts relative paths from absolute paths', () => {
      expect(pathRelative('/home/user/documents/file.txt', '/home/user')).toBe('documents/file.txt')
      expect(pathRelative('/home/user/documents/work/project.txt', '/home/user')).toBe('documents/work/project.txt')
      expect(pathRelative('/var/log/app.log', '/var/log')).toBe('app.log')
    })

    test('handles trailing slashes correctly', () => {
      expect(pathRelative('s3://bucket/data/folder/', 's3://bucket/data/')).toBe('folder')
      expect(pathRelative('s3://bucket/data/folder', 's3://bucket/data/')).toBe('folder')
      expect(pathRelative('s3://bucket/data/folder/', 's3://bucket/data')).toBe('folder')
      expect(pathRelative('/home/user/docs/', '/home/user/')).toBe('docs')
    })

    test('returns empty string when target does not start with base', () => {
      expect(pathRelative('s3://bucket/other/file.txt', 's3://bucket/data')).toBe('')
      expect(pathRelative('s3://other-bucket/file.txt', 's3://bucket/data')).toBe('')
      expect(pathRelative('/var/log/app.log', '/home/user')).toBe('')
      expect(pathRelative('https://example.com/api', 's3://bucket/data')).toBe('')
    })

    test('handles single-level relative paths', () => {
      expect(pathRelative('s3://bucket/data/file.txt', 's3://bucket/data')).toBe('file.txt')
      expect(pathRelative('/home/user/file.txt', '/home/user')).toBe('file.txt')
    })

    test('handles multi-level relative paths', () => {
      expect(pathRelative('s3://bucket/data/a/b/c/file.txt', 's3://bucket/data')).toBe('a/b/c/file.txt')
      expect(pathRelative('/home/user/docs/work/2024/project/file.txt', '/home/user')).toBe('docs/work/2024/project/file.txt')
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

    test('pathRelative and pathJoin roundtrip', () => {
      const basePath = 's3://bucket/data'
      const relativePath = 'folder/subfolder/file.txt'

      // Join to create full path
      const fullPath = pathJoin(basePath, relativePath)
      expect(fullPath).toBe('s3://bucket/data/folder/subfolder/file.txt')

      // Extract relative path back
      const extractedRelative = pathRelative(fullPath, basePath)
      expect(extractedRelative).toBe(relativePath)

      // Verify we can reconstruct the full path
      const reconstructed = pathJoin(basePath, extractedRelative)
      expect(reconstructed).toBe(fullPath)
    })

    test('share URL use case', () => {
      // Simulating the FolderBrowserSharePopover use case
      const rootFolder = 's3://smoosense-demo/PreviewFiles'
      const viewingId = 's3://smoosense-demo/PreviewFiles/audio-files/track.mp3'

      const relativePath = pathRelative(viewingId, rootFolder)
      expect(relativePath).toBe('audio-files/track.mp3')

      // Verify reconstructing works
      const reconstructed = pathJoin(rootFolder, relativePath)
      expect(reconstructed).toBe(viewingId)
    })
  })
})