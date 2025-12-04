'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'

export default function DocsPage() {
  useEffect(() => {
    redirect('/docs/install')
  }, [])

  // Server-side redirect as fallback
  redirect('/docs/install')
}
