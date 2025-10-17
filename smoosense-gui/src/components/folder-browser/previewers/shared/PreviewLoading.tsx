'use client'

interface PreviewLoadingProps {
  message?: string
}

export default function PreviewLoading({ message = "Loading content..." }: PreviewLoadingProps) {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  )
}