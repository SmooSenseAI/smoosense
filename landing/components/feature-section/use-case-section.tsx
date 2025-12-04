import {
  Box,
  Container,
  Flex,
} from '@chakra-ui/react'
import {
  FiZap,
  FiTarget,
} from 'react-icons/fi'
import { FeatureCard } from './feature-card'
import { FeatureTitle } from './feature-title'
import { FeatureImage } from './feature-image'

export const UseCaseSection = () => {
  return (
    <Box py="20" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl">
        <FeatureTitle
          title="Give your data files an intuitive, visual sense"
          avatarSrc="/static/avatar-use-case.png"
          avatarAlt="Use case avatar"
          avatarPosition="left"
        />

        <FeatureImage
          title="Effortlessly browse and understand multimodal data (images, videos, audio, embeddings, json, 3d objects etc)"
          description="TODO"
          imageSrc="/static/use-case.png"
          imageAlt="Use case examples"
        />

        {/* Three cards below */}
        <Flex direction={['column', null, 'row']} gap="6">
          <FeatureCard
            icon={FiZap}
            title="Plug and play"
            description="SmooSense works directly on your folders and files (local or S3) for maximum flexibility. It fits seamlessly into your existing workflow, bringing intuitive visual understanding to your data."
            delay={0.2}
          />
          <FeatureCard
            icon={FiTarget}
            title="Purpose-built for multimodal"
            description="Specially optimized for browsing and exploratory analysis of multimodal data."
            delay={0.4}
          />

        </Flex>
      </Container>
    </Box>
  )
}