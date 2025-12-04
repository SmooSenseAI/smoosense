import {
  Box,
  Container,
  Flex,
} from '@chakra-ui/react'
import {
  FiSmile,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi'
import { FeatureCard } from './feature-card'
import { FeatureTitle } from './feature-title'
import { FeatureVideo } from './feature-video'

export const GraphicalAnalysisSection = () => {
  return (
    <Box py="20" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl">
        <FeatureTitle
          title="Graphical analysis and drill-through"
          avatarSrc="/static/avatar-graphical-analysis.png"
          avatarAlt="Avatar"
          avatarPosition="right"
        />

        <FeatureVideo
          title="Effortlessly move between big picture and fine details"
          description="Explore patterns visually, and one-click to see samples."
          videoSrc="/static/graphical-analysis.mp4"
        />

        {/* Three cards below */}
        <Flex direction={['column', null, 'row']} gap="6">
          <FeatureCard
            icon={FiSearch}
            title="Auto drill-through"
            description="Single click to see associated samples with visuals."
            delay={0.2}
          />
          <FeatureCard
            icon={FiSmile}
            title="Flexible plugin"
            description="Unique data? Bring in your own visualizer as iframe."
            delay={0.4}
          />
          <FeatureCard
            icon={FiTrendingUp}
            title="Large scale"
            description="Designed to handle 10+ million rows on laptop and billion-row on cloud."
            delay={0.6}
          />
        </Flex>
      </Container>
    </Box>
  )
}