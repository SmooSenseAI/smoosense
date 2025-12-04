'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { Box } from '@chakra-ui/react'

interface MermaidProps {
  chart: string
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null)
  const idRef = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    })
  }, [])

  useEffect(() => {
    const renderDiagram = async () => {
      if (ref.current && chart && chart.trim()) {
        try {
          // Generate new unique ID for each render
          const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const { svg } = await mermaid.render(uniqueId, chart.trim())
          ref.current.innerHTML = svg
        } catch (error) {
          console.error('Mermaid error:', error)
          ref.current.innerHTML = `<pre>${chart}</pre>`
        }
      }
    }

    renderDiagram()
  }, [chart])

  return (
    <Box
      ref={ref}
      my={4}
      p={4}
      bg="whiteAlpha.50"
      borderRadius="md"
      overflowX="auto"
      sx={{
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  )
}
