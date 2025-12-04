'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  VStack,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react'
import { FallInPlace } from '#components/motion/fall-in-place'
import { comparison } from '#data/comparison'
import { Logo } from '#data/logo'

export const ComparisonSection = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const smoosenseBg = useColorModeValue('primary.50', 'primary.900')
  const competitorBg = useColorModeValue('gray.50', 'gray.900')

  const renderComparisonTable = (data: typeof comparison.tableau, competitorName: string, title: string, subtitle: string) => (
    <VStack spacing={4}>
      <VStack spacing={2}>
        <Heading size="lg" color="white">
          {title}
        </Heading>
        <Text fontSize="sm" color="gray.400">
          {subtitle}
        </Text>
      </VStack>
      <Box
        bg={bgColor}
        borderRadius="xl"
        overflow="hidden"
        border="1px"
        borderColor={borderColor}
        w="100%"
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th fontSize="md" py={4} textTransform="none">Feature</Th>
              <Th fontSize="md" py={4} textAlign="center" textTransform="none">
                  SmooSense
              </Th>
              <Th fontSize="md" py={4} textAlign="center" textTransform="none">{competitorName}</Th>
            </Tr>
            <Tr>
              <Th fontSize="sm" py={3} color="gray.300" textTransform="none">Common</Th>
              <Th fontSize="sm" py={3} textAlign="left" colSpan={2} bg="gray.50" _dark={{ bg: "gray.700" }} textTransform="none">
                <Box as="ul" fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} pl={0}>
                  {data.common.map((item, index) => (
                    <Box as="li" key={index}>{item}</Box>
                  ))}
                </Box>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.items.map((item, index) => (
              <Tr key={index}>
                <Td fontWeight="semibold" py={4} fontSize="md">
                  {item.feature}
                </Td>
                <Td textAlign="center" py={4} bg={smoosenseBg}>
                  <VStack spacing={1}>
                    <Text fontWeight="bold" fontSize="md">
                      {item.smoosense}
                    </Text>
                    <Box as="ul" fontSize="sm" color="gray.400" textAlign="left" pl={0}>
                      {item.smoosenseNote.map((note, noteIndex) => (
                        <Box as="li" key={noteIndex}>{note}</Box>
                      ))}
                    </Box>
                  </VStack>
                </Td>
                <Td textAlign="center" py={4} bg={competitorBg}>
                  <VStack spacing={1}>
                    <Text fontWeight="semibold" fontSize="md">
                      {item.competitor}
                    </Text>
                    <Box as="ul" fontSize="sm" color="gray.400" textAlign="left" pl={0}>
                      {item.competitorNote.map((note, noteIndex) => (
                        <Box as="li" key={noteIndex}>{note}</Box>
                      ))}
                    </Box>
                  </VStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )

  return (
    <Box py={{ base: 16, lg: 24 }}>
      <Container maxW="container.xl">
        <VStack spacing={12} textAlign="center">
          <FallInPlace>
            <VStack spacing={4}>
              <Heading size="xl" color="white">
                {comparison.title}
              </Heading>
              <Text
                fontSize="xl"
                color="gray.300"
                maxW="600px"
              >
                {comparison.subtitle}
              </Text>
            </VStack>
          </FallInPlace>

          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8} w="100%">
            {/* Left Panel - Compare with BI */}
            <GridItem>
              <FallInPlace delay={0.2}>
                {renderComparisonTable(
                  comparison.tableau,
                  "BI software",
                  "Compare with BI (Business Intelligence) software",
                  "Examples: Tableau, Power BI, SuperSet"
                )}
              </FallInPlace>
            </GridItem>

            {/* Right Panel - Compare with Computer Vision */}
            <GridItem>
              <FallInPlace delay={0.4}>
                {renderComparisonTable(
                  comparison.voxel51,
                  "Voxel51",
                  "Compare with Voxel51",
                  "and other similar computer vision platforms."
                )}
              </FallInPlace>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  )
}