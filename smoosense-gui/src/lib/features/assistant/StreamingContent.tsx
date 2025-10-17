'use client'

import { useState, useEffect, useRef } from 'react'
import CustomMarkdown from '@/components/common/CustomMarkdown'

interface StreamingContentProps {
  content: string
  speed?: number
  onComplete?: () => void
  startDelay?: number
  enabled?: boolean
}

export default function StreamingContent({
  content,
  speed = 30,
  onComplete,
  startDelay = 0,
  enabled = true
}: StreamingContentProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset state when content or enabled changes
  useEffect(() => {
    setDisplayedText(enabled ? '' : content)
    setCurrentIndex(0)
    setHasStarted(enabled && startDelay === 0)
    completedRef.current = false

    if (!enabled && onCompleteRef.current && !completedRef.current) {
      completedRef.current = true
      onCompleteRef.current()
    }
  }, [content, enabled, startDelay])

  // Handle start delay
  useEffect(() => {
    if (!enabled || hasStarted) return

    if (startDelay > 0) {
      const startTimer = setTimeout(() => {
        setHasStarted(true)
      }, startDelay)
      return () => clearTimeout(startTimer)
    } else {
      setHasStarted(true)
    }
  }, [enabled, hasStarted, startDelay])

  // Handle typing animation
  useEffect(() => {
    if (!enabled || !hasStarted || currentIndex >= content.length) {
      if (enabled && hasStarted && currentIndex >= content.length && onCompleteRef.current && !completedRef.current) {
        completedRef.current = true
        onCompleteRef.current()
      }
      return
    }

    const timer = setTimeout(() => {
      setDisplayedText(content.slice(0, currentIndex + 1))
      setCurrentIndex(prev => prev + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [currentIndex, content, speed, hasStarted, enabled])

  return <CustomMarkdown>{displayedText}</CustomMarkdown>
}