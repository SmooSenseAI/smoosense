import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started | SmooSense',
  description: 'Install and get started with SmooSense',
}

export default function StartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
