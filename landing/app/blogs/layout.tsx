import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blogs | SmooSense',
  description: 'SmooSense blog posts and articles',
}

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
