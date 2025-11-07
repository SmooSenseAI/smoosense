'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { sortBy } from 'lodash'
import { getApi } from '@/lib/utils/apiUtils'

interface ParquetInfoProps {
  tablePath: string
}

export default function ParquetInfo({ tablePath }: ParquetInfoProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApi({
      relativeUrl: `parquet/info?filePath=${encodeURIComponent(tablePath)}`,
      setData: (d) => setData(d as Record<string, unknown>),
      setLoading,
      setError,
    })
  }, [tablePath])

  const formatValue = (key: string, value: unknown): string => {
    if (typeof value === 'number') {
      if (key === 'file_size_bytes') {
        return `${(value / (1024 * 1024)).toFixed(2)} MB`
      }
      if (key === 'compression_ratio') {
        return `${value}x`
      }
      return value.toLocaleString()
    }
    return String(value)
  }

  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading parquet info...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Parquet Info</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No parquet info available</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="font-medium text-sm mb-4">Parquet File Information</h3>
      <div className="space-y-2 text-sm">
        {sortBy(Object.entries(data), 0).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-muted-foreground flex-shrink-0">{formatKey(key)}:</span>
            <span>{formatValue(key, value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
