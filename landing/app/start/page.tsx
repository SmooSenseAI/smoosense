'use client'

import {
  Box,
  Button,
  ButtonGroup,
  Container,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { FallInPlace } from '#components/motion/fall-in-place'
import { CodeBlock } from '#components/code-block'

const tabs = [
  { id: 'cli', label: 'CLI', file: '/content/install/cli.md' },
  { id: 'python', label: 'Python', file: '/content/install/python.md' },
  { id: 'jupyter', label: 'Jupyter Notebook', file: '/content/install/jupyter.md' },
  { id: 'macos', label: 'macOS App', file: '/content/install/macos.md' },
]

export default function InstallPage() {
  const [contents, setContents] = useState<Record<string, string>>({})
  const [selectedTab, setSelectedTab] = useState('cli')

  useEffect(() => {
    const loadContent = async () => {
      const loaded: Record<string, string> = {}
      for (const tab of tabs) {
        try {
          const response = await fetch(tab.file)
          loaded[tab.id] = await response.text()
        } catch (error) {
          loaded[tab.id] = `# Error loading content\n\nFailed to load ${tab.label} installation instructions.`
        }
      }
      setContents(loaded)
    }
    loadContent()
  }, [])

  return (
    <Box position="relative" overflow="hidden" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="20" minH="100vh">
        <FallInPlace>
          <Box as="h1" textStyle="h1" textAlign="center" mb={8}>
            Get Started
          </Box>
        </FallInPlace>

        <FallInPlace delay={0.4}>
          <Box maxW="800px" mx="auto">
            <ButtonGroup spacing={2} mb={8} justifyContent="center" display="flex" flexWrap="wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  size="sm"
                  variant={selectedTab === tab.id ? 'solid' : 'outline'}
                  colorScheme="primary"
                  onClick={() => setSelectedTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </ButtonGroup>

            <Box
              bg="whiteAlpha.50"
              _dark={{ bg: 'whiteAlpha.50' }}
              borderRadius="xl"
              p={8}
            >
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ children }) => (
                          <Box
                            as="h1"
                            fontSize="3xl"
                            fontWeight="bold"
                            mb={4}
                            color="gray.900"
                            _dark={{ color: 'white' }}
                          >
                            {children}
                          </Box>
                        ),
                        h2: ({ children }) => (
                          <Box
                            as="h2"
                            fontSize="2xl"
                            fontWeight="semibold"
                            mt={6}
                            mb={3}
                            color="gray.800"
                            _dark={{ color: 'gray.100' }}
                          >
                            {children}
                          </Box>
                        ),
                        p: ({ children }) => (
                          <Box
                            mb={4}
                            color="gray.700"
                            _dark={{ color: 'gray.300' }}
                            lineHeight="tall"
                          >
                            {children}
                          </Box>
                        ),
                        pre: ({ children }: any) => {
                          // Extract code content and language from children
                          const code = children?.props?.children || ''
                          const language = children?.props?.className?.replace('language-', '') || 'bash'
                          return <CodeBlock language={language}>{code}</CodeBlock>
                        },
                        code: ({ className, children }) => {
                          // Inline code
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
                          // Block code - handled by pre
                          return <code className={className}>{children}</code>
                        },
                        a: ({ href, children }) => (
                          <Box
                            as="a"
                            href={href}
                            color="primary.500"
                            _dark={{ color: 'primary.300' }}
                            textDecoration="underline"
                          >
                            {children}
                          </Box>
                        ),
                      }}
                    >
                      {contents[selectedTab] || 'Loading...'}
                    </ReactMarkdown>
            </Box>
          </Box>
        </FallInPlace>
      </Container>
    </Box>
  )
}
