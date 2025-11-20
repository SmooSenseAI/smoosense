import type { AppDispatch } from '@/lib/store'
import type { Stats } from '../queries'
import { getFileType, FileType } from '@/lib/utils/fileTypes'
import { getLanceStats } from './lanceStats'
import { getParquetStats } from './parquetStats'
import { getRowTableStats } from './rowTableStats'

export async function getTableStats(tablePath: string, dispatch: AppDispatch, queryEngine: string): Promise<Record<string, Stats> | null> {
  // Lance tables use their own stats mechanism
  if (queryEngine === 'lance') {
    return getLanceStats(tablePath, dispatch, queryEngine)
  }

  // Check file type to determine which stats function to use
  const fileType = getFileType(tablePath)

  if (fileType === FileType.ColumnarTable) {
    return getParquetStats(tablePath, dispatch, queryEngine)
  } else if (fileType === FileType.RowTable) {
    return getRowTableStats(tablePath, dispatch, queryEngine)
  } else {
    return null
  }
}

export { getLanceStats } from './lanceStats'
export { getParquetStats } from './parquetStats'
export { getRowTableStats } from './rowTableStats'
