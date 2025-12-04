import { Box, Container, Heading, Text } from '@chakra-ui/react'
import matter from 'gray-matter'
import { promises as fs } from 'fs'
import path from 'path'
import { BlogPostClient } from './blog-post-client'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const indexPath = path.join(process.cwd(), 'public', 'content', 'blogs', 'index.json')
  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const blogFiles = JSON.parse(indexContent)

  return blogFiles
    .filter((file: string) => file.endsWith('.md'))
    .map((file: string) => ({
      slug: file.replace('.md', '')
    }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { frontmatter } = await getPost(params.slug)
  return {
    title: frontmatter.title || 'Blog Post',
    description: frontmatter.description || frontmatter.title,
  }
}

function processScriptVariables(content: string): string {
  // Extract script setup block
  const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/)
  if (!scriptMatch) return content

  // Parse variables from script
  const scriptContent = scriptMatch[1]
  const variables: Record<string, string> = {}

  const varRegex = /const\s+(\w+)\s*=\s*"([^"]*)"/g
  let match
  while ((match = varRegex.exec(scriptContent)) !== null) {
    variables[match[1]] = match[2]
  }

  // Remove script tag from content
  let processed = content.replace(/<script setup>[\s\S]*?<\/script>\s*/g, '')

  // Replace Vue template syntax :href="VAR" with href="value" and add target="_blank"
  for (const [varName, value] of Object.entries(variables)) {
    processed = processed.replace(
      new RegExp(`<a :href="${varName}"([^>]*)>`, 'g'),
      `<a href="${value}" target="_blank" rel="noopener noreferrer"$1>`
    )
    processed = processed.replace(new RegExp(`\{\{\\s*${varName}\\s*\}\}`, 'g'), value)
  }

  return processed
}

async function getPost(slug: string) {
  const filePath = path.join(process.cwd(), 'public', 'content', 'blogs', `${slug}.md`)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const { data, content } = matter(fileContent)
  const processedContent = processScriptVariables(content)
  return { frontmatter: data, content: processedContent }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { frontmatter, content } = await getPost(params.slug)

  return <BlogPostClient frontmatter={frontmatter} content={content} />
}
