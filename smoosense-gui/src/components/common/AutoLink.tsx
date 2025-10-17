'use client'

import { CLS } from '@/lib/utils/styles'

interface AutoLinkProps {
  url: string
  className?: string
}

export default function AutoLink({ url, className = '' }: AutoLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      className={`${CLS.HYPERLINK} cursor-pointer py-1 truncate block ${className}`}
      title={url}
    >
      {url}
    </a>
  )
}