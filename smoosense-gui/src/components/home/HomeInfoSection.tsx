'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Play, Download } from 'lucide-react'

export default function HomeInfoSection() {
  const router = useRouter()
  const [folderPath, setFolderPath] = useState('')

  const handleOpenUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleGoToFolder = () => {
    if (folderPath.trim()) {
      router.push(`/FolderBrowser?rootFolder=${encodeURIComponent(folderPath.trim())}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToFolder()
    }
  }

  return (
    <div className="max-w-4xl w-full mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Browse local or s3 folders
      </h2>

      <div className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Enter folder path (e.g., /tmp/folder, ~/Downloads or s3://bucket/path)"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleGoToFolder} disabled={!folderPath.trim()}>
          Go
        </Button>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-6">
        Learn more
      </h2>

      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleOpenUrl('https://smoosense.ai')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Visit homepage
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleOpenUrl('https://smoosense.ai/demos')}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          View demos
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={() => handleOpenUrl('https://smoosense.ai/start')}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Install SmooSense
        </Button>
      </div>
    </div>
  )
}
