import { useState, useEffect, useRef } from 'react'
import { useAppSelector } from '@/lib/hooks'
import { getFileUrl } from '@/lib/utils/apiUtils'
import { type TreeNode } from '@/lib/features/folderTree/folderTreeSlice'

// Helper function to find a node by ID in the tree
function findNodeById(node: TreeNode | null, targetId: string): TreeNode | null {
  if (!node) return null
  if (node.id === targetId) return node
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId)
      if (found) return found
    }
  }
  
  return null
}

interface UseTextContentParams {
  itemId: string | null
  version?: number
}

interface UseTextContentReturn {
  content: string
  isLoading: boolean
  error: string | null
  fileExists: boolean | null
  fullPath: string | null
}

export function useTextContent({ itemId, version = 0 }: UseTextContentParams): UseTextContentReturn {
  const rootNode = useAppSelector(state => state.folderTree.rootNode)
  
  // Find the item in the tree
  const item = itemId ? findNodeById(rootNode, itemId) : null
  const fullPath = item?.path || null
  
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileExists, setFileExists] = useState<boolean | null>(null)

  // Use a ref to track the current fetch to prevent race conditions
  const fetchRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Clear state when itemId or version changes
    setContent('')
    setError(null)
    setFileExists(null)
    setIsLoading(true)

    // Cancel any ongoing fetch
    if (fetchRef.current) {
      fetchRef.current.abort()
    }

    // Create a new AbortController for this fetch
    const abortController = new AbortController()
    fetchRef.current = abortController

    // Only fetch if we have a valid itemId and fullPath
    if (!itemId || !fullPath) {
      setIsLoading(false)
      return
    }

    // Only fetch if it's a file (not a directory)
    if (item?.isDir) {
      setIsLoading(false)
      setError('Cannot read content of a directory')
      return
    }

    fetch(getFileUrl(fullPath, false), { signal: abortController.signal })
      .then(res => {
        // Check if this fetch was cancelled
        if (abortController.signal.aborted) {
          return
        }

        if (!res.ok) {
          if (res.status === 404) {
            setFileExists(false)
            throw new Error('File not found')
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.text()
      })
      .then(text => {
        // Check if this fetch was cancelled
        if (abortController.signal.aborted) {
          return
        }
        setContent(text || '')
        setFileExists(true)
      })
      .catch(err => {
        // Check if this fetch was cancelled
        if (abortController.signal.aborted) {
          return
        }

        setError(err.message)
        if (err.message === 'File not found') {
          // Already handled by the 404 check above
        } else {
          console.error('Error loading file content:', err)
        }
      })
      .finally(() => {
        // Check if this fetch was cancelled
        if (abortController.signal.aborted) {
          return
        }
        setIsLoading(false)
      })

    // Cleanup function to abort fetch when component unmounts or dependencies change
    return () => {
      abortController.abort()
    }
  }, [itemId, version, fullPath, item?.isDir])

  return {
    content,
    isLoading,
    error,
    fileExists,
    fullPath
  }
}