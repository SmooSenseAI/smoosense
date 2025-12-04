import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demos | SmooSense',
  description: 'Explore SmooSense demos and examples',
}

export default function DemosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
