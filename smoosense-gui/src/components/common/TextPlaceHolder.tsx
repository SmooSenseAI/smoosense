import { ReactNode } from 'react'

interface TextPlaceHolderProps {
  children: ReactNode
  className?: string
}

export default function TextPlaceHolder({ 
  children, 
  className = "text-xs text-muted-foreground" 
}: TextPlaceHolderProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      {children}
    </div>
  )
}