export enum FileType {
  Json = 'json',
  ColumnarTable = 'columnar-table',
  RowTable = 'row-table',
  Image = 'image',
  Video = 'video',
  Text = 'text',
  Pdf = 'pdf',
  Unknown = 'unknown'
}

/**
 * Determines the file type based on the file extension
 */
export function getFileType(fileName: string): FileType {
  const extension = fileName.toLowerCase().split('.').pop() || ''

  // Handle compressed files
  if (extension === 'gz') {
    if (fileName.toLowerCase().endsWith('.csv.gz')) {
      return FileType.RowTable
    }
  }

  // Json files (including YAML)
  if (['json', 'yaml', 'yml'].includes(extension)) {
    return FileType.Json
  }
  
  // Columnar table files (efficient for analytics/aggregation)
  if (['parquet'].includes(extension)) {
    return FileType.ColumnarTable
  }
  
  // Row-based table files (efficient for row-by-row access)
  if (['jsonl', 'csv', 'tsv', 'xlsx', 'xls'].includes(extension)) {
    return FileType.RowTable
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif', 'ico', 'heic', 'heif'].includes(extension)) {
    return FileType.Image
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'].includes(extension)) {
    return FileType.Video
  }

  // PDF files
  if (['pdf'].includes(extension)) {
    return FileType.Pdf
  }

  // Text files (including code files)
  if ([
    'txt', 'md', 'markdown', 'rst', 'log',
    'py', 'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less',
    'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
    'xml', 'sql', 'r', 'scala', 'kt', 'dart', 'lua', 'perl', 'vim',
    'dockerfile', 'gitignore', 'gitattributes', 'editorconfig',
    'toml', 'ini', 'cfg', 'conf', 'properties'
  ].includes(extension)) {
    return FileType.Text
  }
  
  return FileType.Unknown
}