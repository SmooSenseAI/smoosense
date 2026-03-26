'use client'

import { useState, useEffect } from 'react'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'
import { getApi } from '@/lib/utils/apiUtils'
import PreviewLoading from './shared/PreviewLoading'
import PreviewError from './shared/PreviewError'

interface ArrayInfo {
  shape: number[]
  dtype: string
  size: number
}

interface NumpyPreviewData {
  type: 'npy' | 'npz'
  arrays: Record<string, ArrayInfo>
}

interface NumpyPreviewerProps {
  item: TreeNode
}

export default function NumpyPreviewer({ item }: NumpyPreviewerProps) {
  const [data, setData] = useState<NumpyPreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApi({
      relativeUrl: `numpy-preview?path=${encodeURIComponent(item.path)}`,
      setData: (d) => setData(d as NumpyPreviewData),
      setLoading: setLoading,
      setError: setError,
    })
  }, [item.path])

  if (loading) return <PreviewLoading message="Loading numpy file..." />
  if (error) return <PreviewError title="Error loading numpy file" message={error} />
  if (!data) return <PreviewError title="No data" message="Could not parse numpy file." />

  const arrayEntries = Object.entries(data.arrays)

  return (
    <div className="w-full h-full overflow-auto p-4">
      <table className="text-sm w-full">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            {data.type === 'npz' && <th className="py-2 pr-4 font-medium">Key</th>}
            <th className="py-2 pr-4 font-medium">Shape</th>
            <th className="py-2 pr-4 font-medium">Dtype</th>
            <th className="py-2 pr-4 font-medium">Size</th>
          </tr>
        </thead>
        <tbody>
          {arrayEntries.map(([name, info]) => (
            <tr key={name} className="border-b border-muted/50">
              {data.type === 'npz' && <td className="py-2 pr-4 font-mono">{name}</td>}
              <td className="py-2 pr-4 font-mono">[{info.shape.join(', ')}]</td>
              <td className="py-2 pr-4 font-mono">{info.dtype}</td>
              <td className="py-2 pr-4 font-mono">{info.size.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
