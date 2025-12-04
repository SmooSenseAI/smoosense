import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  FiLayout,
  FiPackage,
  FiCode,
} from 'react-icons/fi'
import { FeatureCard } from './feature-card'
import { FeatureTitle } from './feature-title'

export const MultimodalTableSection = () => {
  return (
    <Box py="20" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl">
        <FeatureTitle
          title="Clear at a glance. Full details just a click away."
          avatarSrc="/static/avatar-multimodal-table.png"
          avatarAlt="Multimodal table avatar"
        />

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
          <Box
            borderRadius="lg"
            overflow="hidden"
            position="relative"
            bg="gray.700"
          >
            <Box
              as="iframe"
              src="https://demo.smoosense.ai/example/collage"
              width="100%"
              height="710px"
              border="none"
              borderRadius="8px"
              display="block"
              loading="lazy"
            />
          </Box>
        </Box>

        {/* Three cards below */}
        <Flex direction={['column', null, 'row']} gap="6">
          <FeatureCard
            icon={FiLayout}
            title="All in one place"
            description="Stop juggling between tools. Turn your FolderBrowser, Table and Gallery into visual workspaces."
            delay={0.2}
          />
          <FeatureCard
            icon={FiPackage}
            title="Built-in support for common modalities"
            description="Image along with optional mask and overlaid annotations. Audio with Mel-spectrogram automatically computed. Video, robotics motion, 3d objects, json, pdf etc."
            delay={0.4}
          />
          <FeatureCard
            icon={FiCode}
            title="Bring your own visual"
            description="Need a custom visualization? Build it your way and embed it as iframes."
            delay={0.6}
          />
        </Flex>
      </Container>
    </Box>
  )
}