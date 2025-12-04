import { Box, Heading, Text, VStack, Image } from '@chakra-ui/react'

interface FeatureImageProps {
  title: string
  description: string
  imageSrc: string
  imageAlt?: string
}

export const FeatureImage = ({
  title,
  description,
  imageSrc,
  imageAlt = 'Feature image',
}: FeatureImageProps) => {
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
      {/*<VStack spacing="2" alignItems="flex-start" p="8">*/}
      {/*  <Heading size="md" color="white">*/}
      {/*    {title}*/}
      {/*  </Heading>*/}
      {/*  <Text color="gray.300" fontSize="lg">*/}
      {/*    {description}*/}
      {/*  </Text>*/}
      {/*</VStack>*/}

      <Box
        borderRadius="lg"
        overflow="hidden"
        position="relative"
        bg="gray.700"
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width="100%"
          height="auto"
          borderRadius="8px"
        />
      </Box>
    </Box>
  )
}