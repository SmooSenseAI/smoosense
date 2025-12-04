'use client'

import { Box, Button, Container, Heading, Text } from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import Link from 'next/link'
import { useMemo } from 'react'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { createHeaderMap, createMarkdownComponents } from '#components/markdown-components'
import { FiArrowLeft } from 'react-icons/fi'
import 'katex/dist/katex.min.css'

interface BlogPostClientProps {
  frontmatter: any
  content: string
}

export function BlogPostClient({ frontmatter, content }: BlogPostClientProps) {
  // Pre-calculate header numbers from content
  const headerMap = useMemo(() => createHeaderMap(content), [content])
  const components = useMemo(() => createMarkdownComponents(headerMap), [headerMap])

  return (
    <Box position="relative" overflow="hidden">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="20">
        <Heading as="h1" size="2xl" mb={4} color="white">
          {frontmatter.title}
        </Heading>
        {frontmatter.date && (
          <Text fontSize="sm" color="gray.400" mb={2}>
            {new Date(frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        )}
        {frontmatter.tags && (
          <Box mb={8}>
            {frontmatter.tags.map((tag: string) => (
              <Text key={tag} as="span" fontSize="sm" color="primary.300" mr={2}>
                #{tag}
              </Text>
            ))}
          </Box>
        )}

        <Box
          bg="whiteAlpha.50"
          _dark={{ bg: 'whiteAlpha.50' }}
          borderRadius="xl"
          p={8}
        >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={components}
            >
              {content}
            </ReactMarkdown>
        </Box>

        <Box mt={8} textAlign="center">
          <Button
            as={Link}
            href="/blogs"
            leftIcon={<FiArrowLeft />}
            variant="outline"
            colorScheme="primary"
            size="lg"
          >
            Back to all blogs
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
