import { Box } from '@chakra-ui/react'
import { promises as fs } from 'fs'
import path from 'path'
import { DocClient } from './doc-client'
import type { Metadata } from 'next'
import { docsConfig } from '../docs-config'

export function generateStaticParams() {
  return docsConfig.map(doc => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const content = await getDoc(params.slug)

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : 'Documentation'

  return {
    title: `${title} - SmooSense`,
    description: title,
  }
}

async function getDoc(slug: string) {
  const filePath = path.join(process.cwd(), 'public', 'content', 'docs', `${slug}.md`)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return fileContent
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const content = await getDoc(params.slug)

  return <DocClient content={content} />
}
