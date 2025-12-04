import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://smoosense.ai'

  // Static pages
  const routes = [
    '',
    '/start',
    '/demos/',
    '/blogs/',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Blog posts
  const blogsPath = path.join(process.cwd(), 'public', 'content', 'blogs')
  const blogFiles = fs.readdirSync(blogsPath)
  const blogPosts = blogFiles
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(blogsPath, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)
      const slug = file.replace('.md', '')

      return {
        url: `${baseUrl}/blogs/${slug}/`,
        lastModified: data.date ? new Date(data.date) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }
    })

  // Documentation pages
  const docsPath = path.join(process.cwd(), 'public', 'content', 'docs')
  const docFiles = fs.readdirSync(docsPath)
  const docPages = docFiles
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace('.md', '')
      return {
        url: `${baseUrl}/docs/${slug}/`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })

  return [...routes, ...blogPosts, ...docPages]
}
