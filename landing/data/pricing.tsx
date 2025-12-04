import { HStack, Text } from '@chakra-ui/react'

export default {
  title: 'Pricing for every stage',
  description:
    '',
  plans: [
    {
      id: 'open-source',
      title: 'Open Source',
      description: 'Free and open source',
      price: 'Free',
      features: [
        {
          title: 'Free forever',
        },
        {
          title: 'MacOS app (coming)',
        },
        {
          title: 'CLI',
        },
        {
          title: 'Python SDK',
        },
        {
          title: "Full analytics features, up to your computer's hardware limit.",
        },
        {
          title: 'Community support via GitHub.'
        }

      ],
      action: {
        href: '#',
      },
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'with premium support',
      price: 'Contact us',
      isRecommended: true,
      features: [
        {
          title: 'Everything in free tier.',
        },

        null,
        {
          title: 'Prioritized generic feature request',
          iconColor: 'green.500',
        }, {
          title: 'Support for integration and deployment.',
          iconColor: 'green.500',
        },
      ],
      action: {
        href: 'https://appulse.gumroad.com/l/saas-ui-pro-pre-order?variant=Single%20license',
      },
    },
    {
      id: 'solution',
      title: 'Tailored solution',
      description: 'optimized for your use cases',
      price: (
        <HStack>
          <Text>Contact us</Text>
        </HStack>
      ),
      features: [
        {
          title: 'Everything in enterprise tier.',
        },
        null,
        {
          title: 'Tailor-designed for your use cases.',
          iconColor: 'green.500',
        },
        {
          title: 'You own the copyright.',
          iconColor: 'green.500',
        },
      ],
      action: {
        href: 'https://appulse.gumroad.com/l/saas-ui-pro-pre-order?variant=Unlimited%20license',
      },
    },
  ],
}
