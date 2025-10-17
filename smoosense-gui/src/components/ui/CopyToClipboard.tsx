'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { isNil } from 'lodash'
import { CLS } from '@/lib/utils/styles'

interface CopyToClipboardProps {
  value: unknown
  className?: string
}

export default function CopyToClipboard({
  value,
  className = ''
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const textToCopy = isNil(value) ? 'null' : String(value)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = isNil(value) ? 'null' : String(value)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      console.log(error)
    }
  }

  const iconSize = 'h-3 w-3'
  const buttonClass = `${CLS.ICON_BUTTON_SM_SUBTLE} ${className}`

  return (
    <button
      onClick={handleCopy}
      className={buttonClass}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className={`${iconSize} text-green-600`} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  )
}