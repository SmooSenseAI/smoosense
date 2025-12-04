import { Box, Heading, Icon, Text } from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { FallInPlace } from '../motion/fall-in-place'

interface FeatureCardProps {
  icon: IconType
  iconColor?: string
  title: string
  description: string
  delay?: number
}

export const FeatureCard = ({
  icon,
  iconColor = "purple.400",
  title,
  description,
  delay = 0
}: FeatureCardProps) => {
  return (
    <FallInPlace delay={delay}>
      <Box
        flex="1"
        bg="gray.800"
        border="1px solid"
        borderColor="gray.600"
        p="6"
        borderRadius="lg"
        textAlign={{ base: "left", md: "center" }}
      >
        {/* Mobile layout: horizontal flex */}
        <Box display={{ base: "flex", md: "block" }} alignItems="center" gap="3" mb={{ base: "0", md: "4" }}>
          <Icon as={icon} boxSize="6" color={iconColor} mb={{ base: "0", md: "4" }} />
          <Heading size="md" color="white" mb={{ base: "0", md: "3" }}>
            {title}
          </Heading>
        </Box>
        <Text color="gray.300" display={{ base: "none", md: "block" }}>
          {description}
        </Text>
      </Box>
    </FallInPlace>
  )
}