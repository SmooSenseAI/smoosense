'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface LogoProps {
  mini?: boolean
  linkToLanding?: boolean
}

export default function Logo({ mini = false, linkToLanding = false }: LogoProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always show light logo during SSR and initial client render to prevent hydration mismatch
  const isDark = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'))

  // Determine image source based on mini prop and theme
  const imgSrc = `https://cdn.smoosense.ai/${mini ? 'oo' : 'SmooSense'}-${isDark ? 'dark' : 'light'}.svg`

  // Determine href based on linkToLanding prop
  const href = linkToLanding ? 'https://smoosense.ai' : (pathname === '/' ? 'https://smoosense.ai' : '/')
  const isExternal = linkToLanding || pathname === '/'

  return (
    <Link href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
      <img
        src={imgSrc}
        alt="SmooSense"
        className="object-contain h-6 w-auto"
      />
    </Link>
  )
}