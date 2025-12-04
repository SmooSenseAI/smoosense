'use client'

import {
  Box,
  Container,
  Flex,
  VStack,
  Link,
} from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import NextLink from 'next/link'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { FallInPlace } from '#components/motion/fall-in-place'
import { docsConfig } from './docs-config'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Remove trailing slash and get the last segment
  const pathSegments = pathname.replace(/\/$/, '').split('/')
  const currentSlug = pathSegments[pathSegments.length - 1]
  const currentDoc = docsConfig.find(doc => doc.slug === currentSlug)
  const pageTitle = currentDoc ? currentDoc.label : 'Documentation'

  return (
    <Box position="relative" overflow="hidden" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="20" minH="100vh">
        <FallInPlace>
          <Box as="h1" textStyle="h1" textAlign="center" mb={8}>
            {pageTitle}
          </Box>
        </FallInPlace>

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
          {/* Left Sidebar - TOC */}
          <Box
            w={{ base: '100%', lg: '250px' }}
            position={{ base: 'relative', lg: 'sticky' }}
            top={{ lg: '100px' }}
            height={{ lg: 'fit-content' }}
            flexShrink={0}
          >
            <FallInPlace delay={0.2}>
              <Box
                bg="whiteAlpha.50"
                _dark={{ bg: 'whiteAlpha.50' }}
                borderRadius="xl"
                p={4}
              >
                <Box
                  fontSize="sm"
                  fontWeight="bold"
                  mb={3}
                  color="gray.900"
                  _dark={{ color: 'white' }}
                >
                  Table of Contents
                </Box>
                <VStack align="stretch" spacing={2}>
                  {docsConfig.map((item) => (
                    <Link
                      key={item.slug}
                      as={NextLink}
                      href={`/docs/${item.slug}`}
                      fontSize="sm"
                      color={currentSlug === item.slug ? 'primary.500' : 'gray.600'}
                      _dark={{
                        color: currentSlug === item.slug ? 'primary.300' : 'gray.400'
                      }}
                      _hover={{
                        color: 'primary.500',
                        _dark: { color: 'primary.300' }
                      }}
                      transition="color 0.2s"
                      fontWeight={currentSlug === item.slug ? 'semibold' : 'normal'}
                    >
                      {item.label}
                    </Link>
                  ))}
                </VStack>
              </Box>
            </FallInPlace>
          </Box>

          {/* Main Content */}
          <Box flex="1" minW={0}>
            {children}
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
