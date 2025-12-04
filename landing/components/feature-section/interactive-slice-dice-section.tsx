import {
  Box,
  Container,
  Flex,
} from '@chakra-ui/react'
import {
  FiCode,
  FiRefreshCw,
  FiPieChart
} from 'react-icons/fi'
import { FeatureCard } from './feature-card'
import { FeatureTitle } from './feature-title'
import { FeatureVideo } from './feature-video'

export const InteractiveSliceDice = () => {
  return (
    <Box py="20" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl">
        <FeatureTitle
          title="Interactive slice-n-dice"
          avatarSrc="/static/avatar-interactive-slice-dice.png"
          avatarAlt="Interactive slice dice avatar"
          avatarPosition="left"
        />

        <FeatureVideo
          title="Stay in flow: explore distributions, apply filters, and see updates instantly"
          description="SmooSense automatically translates your UI actions into optimized SQL, runs queries in parallel, and refreshes plots on the fly."
          videoSrc="/static/interactive-slice-dice.mp4"
        />

        {/* Three cards below */}
        <Flex direction={['column', null, 'row']} gap="6">
          <FeatureCard
            icon={FiCode}
            title="Effortless SQL"
            description="Powered by DuckDB, it runs directly on your data files on your laptop. Slice and dice instantly at anywhere, no query engine, no ingestion."
            delay={0.2}
          />
          <FeatureCard
            icon={FiPieChart}
            title="Clear view of missing data"
            description="A dedicated chart highlights missing percentages at a glance, while a separate view keeps the real distribution visible—even when missing values dominate."
            delay={0.4}
          />
          <FeatureCard
            icon={FiRefreshCw}
            title="Parallel & Scalable"
            description="Easily scale to tens of million rows on your laptop. Go billions on the cloud."
            delay={0.6}
          />
        </Flex>
      </Container>
    </Box>
  )
}