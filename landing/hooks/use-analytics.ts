'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageview } from '../lib/analytics'

export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageview(pathname)
    }
  }, [pathname])
}