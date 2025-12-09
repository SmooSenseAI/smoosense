import { Box, Heading, Text, Flex, Link } from '@chakra-ui/react'
import { CodeBlock } from '#components/code-block'
import { Mermaid } from '#components/mermaid'
import { ImageGallery } from '#components/image-gallery'
import { Tabs } from '#components/tabs'

// Inject global styles for demo iframe gradient animation
if (typeof window !== 'undefined' && !document.getElementById('demo-gradient-styles')) {
  const styleTag = document.createElement('style')
  styleTag.id = 'demo-gradient-styles'
  styleTag.innerHTML = `
    @keyframes gradientFlow {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .demo-gradient-border {
      animation: gradientFlow 8s ease infinite;
    }
  `
  document.head.appendChild(styleTag)
}

// Pre-calculate header numbers from markdown content
export function createHeaderMap(content: string): Map<string, string> {
  const lines = content.split('\n')
  const map = new Map<string, string>()
  let h2Count = 0
  let h3Count = 0
  let h4Count = 0

  lines.forEach(line => {
    if (line.startsWith('## ')) {
      h2Count++
      h3Count = 0
      h4Count = 0
      const text = line.substring(3).trim()
      map.set(text, `${h2Count}`)
    } else if (line.startsWith('### ')) {
      h3Count++
      h4Count = 0
      const text = line.substring(4).trim()
      map.set(text, `${h2Count}.${h3Count}`)
    } else if (line.startsWith('#### ')) {
      h4Count++
      const text = line.substring(5).trim()
      map.set(text, `${h2Count}.${h3Count}.${h4Count}`)
    }
  })

  return map
}

// Create a factory function that returns fresh components with pre-calculated numbers
export function createMarkdownComponents(headerMap?: Map<string, string>) {
  return {
    h1: ({ children }: any) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return (
        <Heading
          as="h1"
          id={id}
          size="xl"
          mb={4}
          mt={8}
          color="white"
        >
          {children}
        </Heading>
      )
    },
    h2: ({ children }: any) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const num = headerMap?.get(text) || ''
      return (
        <Heading
          as="h2"
          id={id}
          size="lg"
          mb={3}
          mt={6}
          color="gray.100"
          position="relative"
          scrollMarginTop="100px"
          _hover={{
            '& .heading-anchor': {
              opacity: 1,
            }
          }}
        >
          {num && `${num}. `}{children}
          <Link
            href={`#${id}`}
            className="heading-anchor"
            position="absolute"
            left="-1.5rem"
            opacity={0}
            transition="opacity 0.2s"
            color="gray.400"
            _hover={{ color: 'primary.300' }}
            aria-label="Link to this section"
          >
            #
          </Link>
        </Heading>
      )
    },
    h3: ({ children }: any) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const num = headerMap?.get(text) || ''
      return (
        <Heading
          as="h3"
          id={id}
          size="md"
          mb={3}
          mt={4}
          color="gray.100"
          position="relative"
          scrollMarginTop="100px"
          _hover={{
            '& .heading-anchor': {
              opacity: 1,
            }
          }}
        >
          {num && `${num} `}{children}
          <Link
            href={`#${id}`}
            className="heading-anchor"
            position="absolute"
            left="-1.5rem"
            opacity={0}
            transition="opacity 0.2s"
            color="gray.400"
            _hover={{ color: 'primary.300' }}
            aria-label="Link to this section"
          >
            #
          </Link>
        </Heading>
      )
    },
    h4: ({ children }: any) => {
      const text = String(children)
      const num = headerMap?.get(text) || ''
      return (
        <Heading
          as="h4"
          size="md"
          mb={2}
          mt={3}
          color="gray.200"
        >
          {num && `${num} `}{children}
        </Heading>
      )
    },
    p: ({ children }: any) => {
      // Check if this paragraph contains a demo iframe
      const childArray = Array.isArray(children) ? children : [children]
      const hasDemoIframe = childArray.some((child: any) =>
        child?.props?.alt === 'demo'
      )

      if (hasDemoIframe) {
        // Extract the src from the img element
        const imgChild = childArray.find((child: any) => child?.props?.alt === 'demo')
        const demoBaseUrl = 'https://demo.smoosense.ai'
        const demoUrl = `${demoBaseUrl}${imgChild?.props?.src}`

        return (
          <Box mb={6}>
            <Flex justify="center" gap="2" align="center" mb={1} mt={2} px={8}>
              <Text color="gray.300" flexShrink={0}>
                👇 Live demo
              </Text>
              <Link
                href={demoUrl}
                target="_blank"
                color="primary.300"
                fontSize="sm"
                textDecoration="underline"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                maxWidth="600px"
              >
                {demoUrl}
              </Link>
            </Flex>
            <Box
              position="relative"
              width="100%"
              height="600px"
              p="1px"
              borderRadius="md"
              background="linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ff0080, #ff8c00)"
              backgroundSize="400% 400%"
              className="demo-gradient-border"
            >
              <Box
                as="iframe"
                src={demoUrl}
                width="114.29%"
                height="114.29%"
                border="none"
                borderRadius="md"
                bg="white"
                _dark={{ bg: 'gray.900' }}
                transform="scale(0.875)"
                transformOrigin="0 0"
              />
            </Box>
          </Box>
        )
      }

      return (
        <Text
          mb={4}
          color="gray.300"
          lineHeight="tall"
        >
          {children}
        </Text>
      )
    },
    ul: ({ children }: any) => (
      <Box
        as="ul"
        mb={4}
        ml={6}
        color="gray.300"
      >
        {children}
      </Box>
    ),
    ol: ({ children }: any) => (
      <Box
        as="ol"
        mb={4}
        ml={6}
        color="gray.300"
      >
        {children}
      </Box>
    ),
    li: ({ children }: any) => (
      <Text
        as="li"
        mb={2}
        lineHeight="tall"
      >
        {children}
      </Text>
    ),
    pre: ({ children }: any) => {
      const code = children?.props?.children || ''
      const language = children?.props?.className?.replace('language-', '') || 'bash'

      if (language === 'mermaid') {
        return <Mermaid chart={code} />
      }

      if (language === 'gallery') {
        // Parse gallery format: each line is "src | caption"
        // First line can optionally contain config: height=250px maxColumns=3
        const lines = code.trim().split('\n').filter((line: string) => line.trim())

        let config = { thumbnailHeight: '200px', maxColumns: 3 }
        let imageLines = lines

        // Check if first line is config
        if (lines[0] && !lines[0].includes('|')) {
          const configLine = lines[0]
          const heightMatch = configLine.match(/height=(\d+px)/)
          const columnsMatch = configLine.match(/maxColumns=(\d+)/)

          if (heightMatch) config.thumbnailHeight = heightMatch[1]
          if (columnsMatch) config.maxColumns = parseInt(columnsMatch[1])

          imageLines = lines.slice(1)
        }

        const images = imageLines.map((line: string) => {
          const [src, caption] = line.split('|').map((s: string) => s.trim())
          return { src, caption }
        })

        return <ImageGallery images={images} {...config} />
      }

      if (language === 'tabs') {
        return <Tabs content={code} />
      }

      if (language === 'codelink') {
        // Parse codelink format: key-value pairs separated by blank lines
        // Each block can have: anchor, path, line
        const baseUrl = 'https://github.com/SmooSenseAI/smoosense/blob/main'
        const blocks = code.trim().split(/\n\s*\n/).filter((block: string) => block.trim())

        const links = blocks.map((block: string) => {
          const lines = block.trim().split('\n')
          const props: Record<string, string> = {}

          for (const line of lines) {
            const match = line.match(/^(\w+):\s*(.+)$/)
            if (match) {
              props[match[1]] = match[2].trim()
            } else if (line.trim() && !props.path) {
              // Fallback: treat as simple path (backwards compatibility)
              props.path = line.trim()
            }
          }

          return props
        })

        return (
          <Box mb={4}>
            {links.map((props: Record<string, string>, index: number) => {
              const path = props.path || ''
              const fileName = path.split('/').pop() || path
              const anchor = props.anchor
              const line = props.line

              let githubUrl = `${baseUrl}/${path}`
              if (line) {
                githubUrl += `#L${line}`
              }

              const displayText = anchor ? `${anchor} @ ${fileName}` : fileName

              return (
                <Box key={index} mb={1}>
                  <Link
                    href={githubUrl}
                    target="_blank"
                    color="primary.300"
                    fontFamily="mono"
                    fontSize="sm"
                    _hover={{ textDecoration: 'underline' }}
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Text as="span" fontSize="xs">🔗</Text>
                    {displayText}
                  </Link>
                </Box>
              )
            })}
          </Box>
        )
      }

      return <CodeBlock language={language}>{code}</CodeBlock>
    },
    code: ({ className, children }: any) => {
      if (!className) {
        return (
          <Box
            as="code"
            bg="blackAlpha.100"
            _dark={{ bg: 'whiteAlpha.200' }}
            px={2}
            py={1}
            borderRadius="md"
            fontSize="sm"
            fontFamily="mono"
          >
            {children}
          </Box>
        )
      }
      return <code className={className}>{children}</code>
    },
    a: ({ href, children }: any) => (
      <Box
        as="a"
        href={href}
        target="_blank"
        color="primary.300"
        textDecoration="underline"
      >
        {children}
      </Box>
    ),
    img: ({ src, alt, ...props }: any) => {
      // Check if alt text is "demo" for demo iframe
      if (alt === 'demo') {
        const demoUrl = `https://demo.smoosense.ai${src}`
        // Return null and let the parent paragraph handle it
        // This is a workaround - we'll handle it in the paragraph component
        return null
      }

      // Check if alt text is "inline" for inline images with fixed 28px height
      if (alt === 'inline') {
        return (
          <Box
            as="img"
            src={src}
            alt=""
            display="inline"
            height="28px"
            width="auto"
            verticalAlign="middle"
            mx={1}
            {...props}
          />
        )
      }

      // Check if the source is a video file
      const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm') || src?.endsWith('.ogg')

      if (isVideo) {
        return (
          <Box
            as="video"
            src={src}
            controls
            autoPlay
            loop
            muted
            borderRadius="md"
            mb={4}
            width="100%"
            maxW="900px"
            {...props}
          />
        )
      }

      return (
        <Box
          as="img"
          src={src}
          alt={alt}
          borderRadius="md"
          mb={4}
          width="100%"
          maxW="900px"
          {...props}
        />
      )
    },
    table: ({ children }: any) => (
    <Box overflowX="auto" mb={4}>
      <Box as="table" width="100%" color="gray.300">
        {children}
      </Box>
    </Box>
  ),
    th: ({ children }: any) => (
    <Box
      as="th"
      textAlign="left"
      p={2}
      borderBottom="1px solid"
      borderColor="gray.600"
      fontWeight="semibold"
    >
      {children}
    </Box>
  ),
    td: ({ children }: any) => (
      <Box
        as="td"
        p={2}
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        {children}
      </Box>
    ),
  }
}
