'use client'

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Button,
  ButtonGroup,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import matter from 'gray-matter'
import Link from 'next/link'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { FallInPlace } from '#components/motion/fall-in-place'

interface BlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
}

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    const loadPosts = async () => {
      const loadedPosts: BlogPost[] = []
      const tags = new Set<string>()

      // Fetch the list of blog files dynamically
      try {
        const indexResponse = await fetch('/content/blogs/index.json')
        const blogFiles = await indexResponse.json()

        for (const file of blogFiles) {
          if (file === 'index.md' || file === 'index.json') continue

          try {
            const response = await fetch(`/content/blogs/${file}`)
            const content = await response.text()
            const { data } = matter(content)

            loadedPosts.push({
              slug: file.replace('.md', ''),
              title: data.title || file,
              date: data.date || '',
              tags: data.tags || [],
            })

            if (data.tags && Array.isArray(data.tags)) {
              data.tags.forEach((tag: string) => tags.add(tag))
            }
          } catch (error) {
            console.error(`Failed to load ${file}:`, error)
          }
        }

        loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setPosts(loadedPosts)
        setAllTags(['All', ...Array.from(tags).sort()])
      } catch (error) {
        console.error('Failed to load blog index:', error)
      }
    }

    loadPosts()
  }, [])

  const filteredPosts =
    selectedTag === 'All'
      ? posts
      : posts.filter((post) => post.tags.includes(selectedTag))

  return (
    <Box position="relative" overflow="hidden" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="20" minH="100vh">
        <FallInPlace>
          <Box as="h1" textStyle="h1" textAlign="center" mb={8}>
            Blogs
          </Box>
        </FallInPlace>

        <FallInPlace delay={0.2}>
          <ButtonGroup spacing={2} mb={8} justifyContent="center" display="flex" flexWrap="wrap">
            {allTags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant={selectedTag === tag ? 'solid' : 'outline'}
                colorScheme="primary"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </ButtonGroup>
        </FallInPlace>

        <FallInPlace delay={0.4}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {filteredPosts.map((post) => (
              <Box
                key={post.slug}
                as={Link}
                href={`/blogs/${post.slug}`}
                bg="whiteAlpha.50"
                _dark={{ bg: 'whiteAlpha.50' }}
                borderRadius="xl"
                p={6}
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-4px)',
                  bg: 'whiteAlpha.100',
                  _dark: { bg: 'whiteAlpha.100' },
                }}
                cursor="pointer"
              >
                <Stack spacing={3}>
                  <Heading size="md" color="white">
                    {post.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.400">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Box>
                    {post.tags.map((tag) => (
                      <Text
                        key={tag}
                        as="span"
                        fontSize="xs"
                        color="primary.300"
                        mr={2}
                      >
                        #{tag}
                      </Text>
                    ))}
                  </Box>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </FallInPlace>
      </Container>
    </Box>
  )
}
