'use client'

import { useMemo, memo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WordScoresProps {
  value: string
}

type WordScore = [string, number]

const WordScores = memo(function WordScores({ value }: WordScoresProps) {
  const renderedWords = useMemo(() => {
    try {
      // Parse JSON string
      const parsed = JSON.parse(value)

      // Check if it's an array
      if (!Array.isArray(parsed)) {
        return null
      }

      // Validate structure: array of arrays, each inner array has length 2
      const isValidStructure = parsed.every(item =>
        Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === 'string' &&
        typeof item[1] === 'number'
      )

      if (!isValidStructure) {
        return null
      }

      const wordScores = parsed as WordScore[]

      // Find max score for scaling
      const maxScore = Math.max(...wordScores.map(([, score]) => score))

      if (maxScore === 0) {
        return wordScores.map(([word, score]) => ({ word, score, opacity: 0 }))
      }

      // Scale scores to [0, 1] and ensure minimum visibility
      return wordScores.map(([word, score]) => ({
        word,
        score,
        opacity: Math.max(0.1, Math.min(1, score / maxScore))
      }))

    } catch {
      return null
    }
  }, [value])

  if (!renderedWords) {
    return (
      <div className="text-sm text-muted-foreground">
        Invalid word scores format
      </div>
    )
  }

  return (
    <TooltipProvider>
      <p className="text-sm leading-relaxed text-foreground">
        {renderedWords.map(({ word, opacity, score }, index) => (
          <span key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="px-0.5 py-0.5"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${opacity})`
                  }}
                >
                  {word}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  <span className="font-medium">{word}</span>: {score.toFixed(4)}
                </p>
              </TooltipContent>
            </Tooltip>
            {index < renderedWords.length - 1 && ' '}
          </span>
        ))}
      </p>
    </TooltipProvider>
  )
})

export default WordScores