'use client'

import {
  Box,
  Button,
  ButtonGroup,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { useState, useMemo, useRef } from 'react'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { FallInPlace } from '#components/motion/fall-in-place'
import { demos } from '#data/demos'

function DemoCard({ demo }: { demo: typeof demos[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <Box
      as="a"
      href={demo.url}
      target="_blank"
      rel="noopener noreferrer"
      bg="whiteAlpha.50"
      _dark={{ bg: 'whiteAlpha.50' }}
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-4px)',
        bg: 'whiteAlpha.100',
        _dark: { bg: 'whiteAlpha.100' },
      }}
      cursor="pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        position="relative"
        w="100%"
        paddingBottom="100%"
        overflow="hidden"
        bg="black"
      >
        <Box
          as="video"
          ref={videoRef}
          src={demo.video}
          loop
          muted
          playsInline
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>
      <Box p={4}>
        <Text
          color="gray.300"
          lineHeight="tall"
          noOfLines={3}
          mb={3}
        >
          {demo.description}
        </Text>
        <Box>
          {demo.categories.map((cat) => (
            <Text
              key={cat}
              as="span"
              fontSize="xs"
              color="primary.300"
              mr={2}
            >
              #{cat}
            </Text>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default function DemosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    demos.forEach(demo => {
      demo.categories.forEach(cat => categories.add(cat))
    })
    return ['All', ...Array.from(categories).sort()]
  }, [])

  const filteredDemos = useMemo(() => {
    if (selectedCategory === 'All') return demos
    return demos.filter(demo => demo.categories.includes(selectedCategory))
  }, [selectedCategory])

  return (
    <Box position="relative" overflow="hidden" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Box px={{ base: 4, md: 8, lg: 12 }} pt={{ base: 20, lg: 40 }} pb="20" minH="100vh">
        <FallInPlace>
          <Box as="h1" textStyle="h1" textAlign="center" mb={8}>
            Demos
          </Box>
        </FallInPlace>

        <FallInPlace delay={0.2}>
          <ButtonGroup spacing={2} mb={8} justifyContent="center" display="flex" flexWrap="wrap">
            {allCategories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'solid' : 'outline'}
                colorScheme="primary"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </ButtonGroup>
        </FallInPlace>

        <FallInPlace delay={0.4}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {filteredDemos.map((demo, index) => (
              <DemoCard key={index} demo={demo} />
            ))}
          </SimpleGrid>
        </FallInPlace>
      </Box>
    </Box>
  )
}
