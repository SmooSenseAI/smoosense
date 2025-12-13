import { Button } from '@chakra-ui/react'
import { Link } from '@saas-ui/react'
import { NextSeoProps } from 'next-seo'
import { FaGithub, FaTwitter, FaLinkedin, FaCalendarAlt } from 'react-icons/fa'
import { FiCheck } from 'react-icons/fi'
import { Logo } from './logo'

const siteConfig = {
  logo: Logo,
  seo: {
    title: 'SmooSense',
    description: '10x easier to analyze your multimodal data',
  } as NextSeoProps,
  termsUrl: '#',
  privacyUrl: '#',
  header: {
    links: [
      {
        id: 'home',
        label: 'Home',
        children: [
          {
            id: 'intro',
            label: 'Introduction',
            href: '/#intro',
          },
          {
            id: 'features',
            label: 'Features',
            href: '/#features',
          },
          {
            id: 'comparison',
            label: 'Comparison',
            href: '/#comparison',
          },

          {
            id: 'pricing',
            label: 'Pricing',
            href: '/#pricing',
          },
          {
            id: 'faq',
            label: 'FAQ',
            href: '/#faq',
          },
        ],
      },
      {
        id: 'demos',
        href: '/demos',
        label: 'Demos',
      },
      {
        id: 'docs',
        href: '/docs',
        label: 'Docs',
      },
      {
        id: 'blogs',
        href: '/blogs',
        label: 'Blogs',
      },

      {
        label: 'Start',
        href: '/start',
        variant: 'primary',
      },
    ],
  },
  footer: {
    copyright: (
      <>
        Copyright © {new Date().getFullYear()} SmooSense 
      </>
    ),
    links: [
      {
        href: 'mailto:contact@smoosense.ai',
        label: 'Contact',
      },
      {
        href: 'https://calendar.app.google/7ryR8DPtzYzfw1Pw7',
        label: <FaCalendarAlt size="14" />,
      },
      {
        href: 'https://www.linkedin.com/company/smoosense-ai',
        label: <FaLinkedin size="14" />,
      },
      {
        href: 'https://x.com/smoosense',
        label: <FaTwitter size="14" />,
      },
      {
        href: 'https://github.com/SmooSenseAI/smoosense',
        label: <FaGithub size="14" />,
      },
    ],
  },
  signup: {
    title: 'Start building with Saas UI',
    features: [
      {
        icon: FiCheck,
        title: 'Accessible',
        description: 'All components strictly follow WAI-ARIA standards.',
      },
      {
        icon: FiCheck,
        title: 'Themable',
        description:
          'Fully customize all components to your brand with theme support and style props.',
      },
      {
        icon: FiCheck,
        title: 'Composable',
        description:
          'Compose components to fit your needs and mix them together to create new ones.',
      },
      {
        icon: FiCheck,
        title: 'Productive',
        description:
          'Designed to reduce boilerplate and fully typed, build your product at speed.',
      },
    ],
  },
}

export default siteConfig
