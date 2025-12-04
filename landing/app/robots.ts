import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/out/',
        '*.json',
      ],
    },
    sitemap: 'https://smoosense.ai/sitemap.xml',
  }
}
