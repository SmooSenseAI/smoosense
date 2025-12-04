import { Box, Heading, Text, VStack } from '@chakra-ui/react'

interface FeatureVideoProps {
  title: string
  description: string
  videoSrc: string
}

export const FeatureVideo = ({
  title,
  description,
  videoSrc,
}: FeatureVideoProps) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.600"
      p="0"
      mb="6"
      position="relative"
      overflow="hidden"
    >
      <VStack spacing="2" alignItems="flex-start" p="8">
        <Heading size="md" color="white">
          {title}
        </Heading>
        <Text color="gray.300" fontSize="lg">
          {description}
        </Text>
      </VStack>

      <Box
        borderRadius="lg"
        overflow="hidden"
        position="relative"
        bg="gray.700"
      >
        <video
          width="100%"
          height="auto"
          autoPlay
          muted
          loop
          playsInline
          style={{
            borderRadius: '8px',
            display: 'block',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>
    </Box>
  )
}