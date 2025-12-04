'use client'

import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Icon,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Br } from '@saas-ui/react'
import type { NextPage } from 'next'
import { FiArrowRight } from 'react-icons/fi'

import * as React from 'react'

import { Faq } from '#components/faq'
import { ComparisonSection } from '#components/comparison/comparison-section'
import { GraphicalAnalysisSection } from '#components/feature-section/graphical-analysis-section'
import { InteractiveSliceDice } from '#components/feature-section/interactive-slice-dice-section'
import { MultimodalTableSection } from '#components/feature-section/multimodal-table-section'
import { UseCaseSection } from '#components/feature-section/use-case-section'
import { GetStartedButton } from '#components/get-started-button/get-started-button'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { FallInPlace } from '#components/motion/fall-in-place'
import { Pricing } from '#components/pricing/pricing'
import { Testimonial, Testimonials } from '#components/testimonials'
import faq from '#data/faq'
import { Logo } from '#data/logo'
import pricing from '#data/pricing'
import testimonials from '#data/testimonials'

const Home: NextPage = () => {
  return (
    <Box>
      <Box id="into" />
      <HeroSection />

      <Box id="features" />
      <UseCaseSection />
      <MultimodalTableSection />

      <InteractiveSliceDice />
      <GraphicalAnalysisSection />

      <Box id="comparison" />
      <ComparisonSection />

      {/*<TestimonialsSection />*/}
      <Box id="pricing" />
      <PricingSection />


      <Box id="faq" />
      <FaqSection />
    </Box>
  )
}

const HeroSection: React.FC = () => {
  return (
    <Box position="relative" overflow="hidden">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="20">
        {/* Header with Logo and Title on same line */}
        <FallInPlace>
          <Flex
            align="flex-end"
            justify="center"
            alignItems="center"
            mb={8}
            gap={4}
            direction={{ base: 'column', lg: 'row' }}
          >
            <Box pb={3}>
              <Logo height="12" />
            </Box>
            <Box as="h1" textStyle="h1" textAlign="center">
              open source multimodal data IDE
            </Box>

          </Flex>
        </FallInPlace>

        {/* Subtitle and Buttons */}
        <VStack spacing={6} textAlign="center" mb={8}>
          <FallInPlace delay={0.4}>
            <Flex
              gap={2}
              flexWrap="wrap"
              justifyContent="center"
              alignItems="center"
            >
              <Box
                as="a"
                href="https://github.com/SmooSenseAI/smoosense"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://img.shields.io/github/stars/SmooSenseAI/smoosense"
                  alt="GitHub stars"
                />
              </Box>
              <Box
                as="a"
                href="https://github.com/SmooSenseAI/smoosense/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://img.shields.io/github/issues/SmooSenseAI/smoosense?label=Submit+new+issue"
                  alt="Submit new issue"
                />
              </Box>
              <Box
                as="a"
                href="https://pepy.tech/project/smoosense"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://static.pepy.tech/personalized-badge/smoosense?period=total&units=international_system&left_color=black&right_color=MAGENTA&left_text=downloads"
                  alt="Downloads"
                />
              </Box>
              <Box
                as="a"
                href="https://github.com/SmooSenseAI/smoosense/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://img.shields.io/github/license/SmooSenseAI/smoosense"
                  alt="License"
                />
              </Box>
              <Box
                as="a"
                href="https://github.com/SmooSenseAI/smoosense/actions/workflows/ci.yml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://github.com/SmooSenseAI/smoosense/actions/workflows/ci.yml/badge.svg"
                  alt="CI Status"
                />
              </Box>
              <Box
                as="a"
                href="https://pypi.org/project/smoosense/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box
                  as="img"
                  src="https://img.shields.io/pypi/v/smoosense?label=pypi-latest"
                  alt="Latest version"
                />
              </Box>
            </Flex>
          </FallInPlace>


          <FallInPlace delay={0.8}>
            <ButtonGroup spacing={4} alignItems="center">
              <GetStartedButton />
              <Button
                as="a"
                size="lg"
                href="/demos"
                variant="outline"
                rel="noopener noreferrer"
                rightIcon={
                  <Icon
                    as={FiArrowRight}
                    sx={{
                      transitionProperty: 'common',
                      transitionDuration: 'normal',
                      '.chakra-button:hover &': {
                        transform: 'translate(5px)',
                      },
                    }}
                  />
                }
              >
                Try demos
              </Button>
              <Button
                as="a"
                size="lg"
                href="https://calendar.app.google/7ryR8DPtzYzfw1Pw7"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                Schedule a meeting
              </Button>
            </ButtonGroup>
          </FallInPlace>
        </VStack>

        {/* YouTube Video */}
        <FallInPlace delay={1.0}>
          <Box position="relative" width="100%" height={{ base: "300px", lg: "750px" }}>
            <Box
              as="iframe"
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/jIAnC-JBtk0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              borderRadius="xl"
            />
          </Box>
        </FallInPlace>
      </Container>
    </Box>
  )
}

const TestimonialsSection = () => {
  const columns = React.useMemo(() => {
    return testimonials.items.reduce<Array<typeof testimonials.items>>(
      (columns, t, i) => {
        columns[i % 3].push(t)

        return columns
      },
      [[], [], []],
    )
  }, [])

  return (
    <Testimonials
      title={testimonials.title}
      columns={[1, 2, 3]}
      innerWidth="container.xl"
    >
      <>
        {columns.map((column, i) => (
          <Stack key={i} spacing="8">
            {column.map((t, i) => (
              <Testimonial key={i} {...t} />
            ))}
          </Stack>
        ))}
      </>
    </Testimonials>
  )
}

const PricingSection = () => {
  return (
    <Pricing {...pricing}>
      <Text p="8" textAlign="center" color="muted">
        VAT may be applicable depending on your location.
      </Text>
    </Pricing>
  )
}

const FaqSection = () => {
  return <Faq {...faq} />
}

export default Home
