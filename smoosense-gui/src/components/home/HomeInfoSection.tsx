'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Play, Download, AlertCircle } from 'lucide-react'
import { API_PREFIX } from '@/lib/utils/urlUtils'
import { debounce } from 'lodash'
import { useAppDispatch } from '@/lib/hooks'
import { setRootFolder } from '@/lib/features/ui/uiSlice'

type PathType = 's3' | 'local' | 'invalid' | 'empty'

function getPathType(path: string, isLocal: boolean): PathType {
  const trimmed = path.trim()
  if (!trimmed) return 'empty'
  // Match partial s3:// prefix as user is typing
  if (trimmed.startsWith('s3://') || 's3://'.startsWith(trimmed)) return 's3'
  if (trimmed.startsWith('/') || trimmed.startsWith('~')) {
    return isLocal ? 'local' : 'invalid'
  }
  return 'invalid'
}

export default function HomeInfoSection() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [folderPath, setFolderPath] = useState('')
  const [isLocal, setIsLocal] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = window.location.href
    setIsLocal(url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1'))
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (path: string, local: boolean) => {
        const pathType = getPathType(path, local)
        if (pathType === 'empty' || pathType === 'invalid') {
          setSuggestions([])
          return
        }

        try {
          const endpoint = pathType === 's3'
            ? `${API_PREFIX}/s3-typeahead`
            : `${API_PREFIX}/typeahead`

          const response = await fetch(`${endpoint}?path=${encodeURIComponent(path)}`)
          if (response.ok) {
            const data = await response.json()
            setSuggestions(data)
            setShowSuggestions(data.length > 0)
            setSelectedIndex(-1)
          }
        } catch {
          setSuggestions([])
        }
      }, 300),
    []
  )

  const handleOpenUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleGoToFolder = () => {
    if (folderPath.trim()) {
      dispatch(setRootFolder(folderPath.trim()))
      router.push(`/FolderBrowser?rootFolder=${encodeURIComponent(folderPath.trim())}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFolderPath(value)
    fetchSuggestions(value, isLocal)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setFolderPath(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    // Fetch new suggestions for the selected path
    fetchSuggestions(suggestion, isLocal)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex])
      } else {
        handleGoToFolder()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      const idx = selectedIndex >= 0 ? selectedIndex : 0
      handleSelectSuggestion(suggestions[idx])
    }
  }

  const pathType = getPathType(folderPath, isLocal)
  const showError = pathType === 'invalid'

  return (
    <div className="max-w-4xl w-full mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {isLocal ? 'Browse local or S3 folders' : 'Browse S3 folders'}
      </h2>

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isLocal
              ? "Enter folder path (e.g., /tmp/folder, ~/Downloads or s3://bucket/path)"
              : "Enter S3 path (e.g., s3://bucket/path)"
            }
            value={folderPath}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={`font-mono ${showError ? 'border-red-500' : ''}`}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-3 py-2 cursor-pointer text-sm font-mono truncate ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button onClick={handleGoToFolder} disabled={!folderPath.trim() || showError}>
          Go
        </Button>
      </div>
      {showError && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-6">
          <AlertCircle className="h-4 w-4" />
          {isLocal
            ? 'Path must start with /, ~, or s3://'
            : 'Path must start with s3:// (local paths not available on cloud)'
          }
        </div>
      )}
      {!showError && <div className="mb-6" />}

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
