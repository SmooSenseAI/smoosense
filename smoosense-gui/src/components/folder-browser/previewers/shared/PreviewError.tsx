'use client'

interface PreviewErrorProps {
  title: string
  message: string
  details?: string
}

export default function PreviewError({ title, message, details }: PreviewErrorProps) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <h4 className="text-sm font-medium text-red-800 mb-1">{title}</h4>
      <p className="text-sm text-red-600">{message}</p>
      {details && (
        <p className="text-xs text-red-500 mt-2">{details}</p>
      )}
    </div>
  )
}