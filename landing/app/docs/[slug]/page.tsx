import { Box } from '@chakra-ui/react'
import { promises as fs } from 'fs'
import path from 'path'
import { DocClient } from './doc-client'
import type { Metadata } from 'next'
import { docsConfig } from '../docs-config'

export function generateStaticParams() {
  return docsConfig.flatMap(section => section.items.map(doc => ({ slug: doc.slug })))
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

function includeLang(filePath: string): string {
  const base = path.basename(filePath)
  if (base === 'Dockerfile') return 'dockerfile'
  if (base === 'Makefile') return 'makefile'
  const ext = path.extname(filePath).slice(1)
  if (ext === 'py') return 'python'
  if (ext === 'ts') return 'typescript'
  if (ext === 'js') return 'javascript'
  return ext
}

async function getDoc(slug: string) {
  const filePath = path.join(process.cwd(), 'public', 'content', 'docs', `${slug}.md`)
  let content = await fs.readFile(filePath, 'utf-8')

  // Expand <!-- $include: relative/path --> directives with the file's contents
  const includeRegex = /<!--\s*\$include:\s*(\S+)\s*-->/
  let match: RegExpExecArray | null
  while ((match = includeRegex.exec(content)) !== null) {
    const includePath = path.join(process.cwd(), 'public', 'content', match[1])
    try {
      const included = await fs.readFile(includePath, 'utf-8')
      const lang = includeLang(match[1])
      content = content.replace(match[0], `\`\`\`${lang}\n${included}\`\`\``)
    } catch {
      // Leave directive in place if the file cannot be read
      break
    }
  }

  return content
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const content = await getDoc(params.slug)

  return <DocClient content={content} />
}
