'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LanceIndices from '@/components/db/LanceIndices'
import LanceVersions from '@/components/db/LanceVersions'
import ParquetInfo from './ParquetInfo'
import { pathDirname, pathBasename } from '@/lib/utils/pathUtils'

enum FileType {
  Lance = 'lance',
  Parquet = 'parquet',
  None = 'none'
}

interface FormatSpecialInfoProps {
  tablePath: string
}

export default function FormatSpecialInfo({ tablePath }: FormatSpecialInfoProps) {
  // Determine file type
  const getFileType = (path: string): FileType => {
    if (path.endsWith('.lance')) return FileType.Lance
    if (path.endsWith('.parquet')) return FileType.Parquet
    return FileType.None
  }

  const fileType = getFileType(tablePath)

  switch (fileType) {
    case FileType.Lance: {
      // Extract rootFolder and tableName from tablePath
      const rootFolder = pathDirname(tablePath)
      const tableName = pathBasename(tablePath).replace('.lance', '')

      return (
        <div className="h-full flex flex-col">
          <Tabs defaultValue="indices" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mx-6 mt-6">
              <TabsTrigger value="indices" className="cursor-pointer">Indices</TabsTrigger>
              <TabsTrigger value="versions" className="cursor-pointer">Versions</TabsTrigger>
            </TabsList>
            <TabsContent value="indices" className="flex-1 px-6 pb-6 overflow-hidden">
              <LanceIndices rootFolder={rootFolder} tableName={tableName} />
            </TabsContent>
            <TabsContent value="versions" className="flex-1 px-6 pb-6 overflow-hidden">
              <LanceVersions rootFolder={rootFolder} tableName={tableName} />
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    case FileType.Parquet:
      return <ParquetInfo tablePath={tablePath} />

    case FileType.None:
    default:
      // Default placeholder for other file types
      return (
        <div className="h-full p-6 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">
            Additional content area
          </div>
        </div>
      )
  }
}
