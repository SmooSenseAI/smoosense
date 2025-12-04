import { Box, Flex, Heading, Image } from '@chakra-ui/react'

interface FeatureTitleProps {
  title: string
  avatarSrc: string
  avatarAlt: string
  avatarPosition?: 'left' | 'right'
}

export const FeatureTitle = ({
  title,
  avatarSrc,
  avatarAlt,
  avatarPosition = 'right'
}: FeatureTitleProps) => {
  const titleElement = (
    <Box flex="1" textAlign={avatarPosition === 'right' ? 'left' : 'right'} px="0">
      <Heading size="xl" color="white">
        {title}
      </Heading>
    </Box>
  )

  const avatarElement = (
    <Box>
      <Image
        src={avatarSrc}
        alt={avatarAlt}
        h="28"
        objectFit="cover"
      />
    </Box>
  )

  return (
    <Flex justify="space-between" align="center" px="8" mb="0">
      {avatarPosition === 'left' ? (
        <>
          {avatarElement}
          {titleElement}
        </>
      ) : (
        <>
          {titleElement}
          {avatarElement}
        </>
      )}
    </Flex>
  )
}